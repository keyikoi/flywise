/**
 * FlyAI CLI 客户端
 *
 * 通过执行 flyai-cli 命令调用飞猪旅行服务
 * 用于航班、酒店、景点等旅游产品搜索
 */

const { execSync } = require('child_process');

/**
 * 航班搜索结果
 * @typedef {Object} FlyAiFlight
 * @property {string} id - 航班 ID
 * @property {string} airline - 航空公司名称
 * @property {string} flight_number - 航班号
 * @property {string} origin - 出发机场代码
 * @property {string} destination - 到达机场代码
 * @property {string} depart_time - 出发时间
 * @property {string} arrive_time - 到达时间
 * @property {number} price - 价格
 * @property {number} duration - 飞行时长（分钟）
 * @property {number} stops - 中转次数
 * @property {string} jumpUrl - 预订链接
 */

class FlyAiClient {
    /**
     * 执行 FlyAI CLI 命令
     * @param {string} command - 命令名称
     * @param {Object} params - 参数对象
     * @returns {Object} 解析后的 JSON 结果
     */
    executeCommand(command, params = {}) {
        const args = Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `--${key} "${value}"`)
            .join(' ');

        const fullCommand = `flyai ${command} ${args}`;

        try {
            console.log(`[FlyAI] 执行命令：${fullCommand}`);
            const output = execSync(fullCommand, {
                encoding: 'utf-8',
                timeout: 30000 // 30 秒超时
            });

            const result = JSON.parse(output);
            if (result.status === 0) {
                console.log(`[FlyAI] 执行成功`);
                return result.data;
            } else {
                console.error(`[FlyAI] 执行失败：${result.message}`);
                return null;
            }
        } catch (error) {
            console.error(`[FlyAI] 执行命令失败：${error.message}`);
            return null;
        }
    }

    /**
     * 快速搜索（全品类旅游产品）
     * @param {string} query - 自然语言查询
     * @returns {Object} 搜索结果
     */
    fastSearch(query) {
        return this.executeCommand('fliggy-fast-search', { query });
    }

    /**
     * 搜索航班
     * @param {Object} params - 搜索参数
     * @param {string} params.origin - 出发城市
     * @param {string} params.destination - 目的地城市
     * @param {string} params.depDate - 出发日期 (YYYY-MM-DD)
     * @param {string} [params.returnDate] - 返程日期
     * @returns {FlyAiFlight[]} 航班列表
     */
    searchFlights(params) {
        const { origin, destination, depDate, returnDate } = params;

        const result = this.executeCommand('search-flight', {
            origin,
            destination,
            'dep-date': depDate,
            'back-date': returnDate,
        });

        if (!result || !result.itemList) {
            return [];
        }

        return this.parseFlights(result.itemList);
    }

    /**
     * 解析 FlyAI 航班数据
     * @param {Array} itemList - FlyAI 返回的航班列表
     * @returns {FlyAiFlight[]} 标准化航班数据
     */
    parseFlights(itemList) {
        return itemList.map((item, index) => {
            const journey = item.journeys?.[0];
            if (!journey) return null;

            const segments = journey.segments || [];
            const firstSegment = segments[0];
            const lastSegment = segments[segments.length - 1];

            if (!firstSegment) return null;

            // 计算中转次数
            const stops = segments.length - 1;

            // 提取中转城市
            const stopCities = segments.slice(1, -1).map(seg =>
                seg.arrCityName || seg.depCityName || ''
            ).filter(Boolean);

            return {
                id: `flyai-${index}-${Date.now()}`,
                source: 'flyai',
                airline: firstSegment.marketingTransportName || '未知航空',
                airline_code: firstSegment.marketingTransportNo?.substring(0, 2) || '',
                flight_number: firstSegment.marketingTransportNo || '',
                origin: firstSegment.depStationCode || '',
                origin_name: firstSegment.depStationName || '',
                destination: lastSegment.arrStationCode || '',
                destination_name: lastSegment.arrStationName || '',
                depart_time: this.formatTime(firstSegment.depDateTime),
                arrive_time: this.formatTime(firstSegment.arrDateTime),
                depart_datetime: firstSegment.depDateTime,
                arrive_datetime: firstSegment.arrDateTime,
                duration: this.formatDuration(parseInt(journey.totalDuration) || 0),
                durationMinutes: parseInt(journey.totalDuration) || 0,
                price: parseFloat(item.ticketPrice) || 0,
                currency: 'CNY',
                stops,
                stop_cities: stopCities,
                journeyType: journey.journeyType,
                jumpUrl: item.jumpUrl || '',
            };
        }).filter(Boolean);
    }

    /**
     * 格式化时间字符串
     * @param {string} dateTime - 日期时间字符串 (YYYY-MM-DD HH:mm:ss)
     * @returns {string} HH:mm 格式
     */
    formatTime(dateTime) {
        if (!dateTime) return '';
        const match = dateTime.match(/(\d{2}):(\d{2}):\d{2}/);
        if (match) {
            return `${match[1]}:${match[2]}`;
        }
        return '';
    }

    /**
     * 格式化时长
     * @param {number} minutes - 分钟数
     * @returns {string} XhYm 格式
     */
    formatDuration(minutes) {
        if (!minutes || minutes <= 0) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h${m}m`;
    }

    /**
     * 搜索酒店
     * @param {Object} params - 搜索参数
     * @param {string} params.destName - 目的地城市
     * @param {string} [params.poiName] - 附近景点
     * @param {string} [params.checkInDate] - 入住日期
     * @param {string} [params.checkOutDate] - 退房日期
     * @returns {Object} 酒店列表
     */
    searchHotels(params) {
        const { destName, poiName, checkInDate, checkOutDate } = params;

        return this.executeCommand('search-hotels', {
            'dest-name': destName,
            'poi-name': poiName,
            'check-in-date': checkInDate,
            'check-out-date': checkOutDate,
        });
    }

    /**
     * 搜索景点/POI
     * @param {Object} params - 搜索参数
     * @param {string} params.cityName - 城市名称
     * @param {string} [params.keyword] - 关键词
     * @param {string} [params.category] - 分类
     * @returns {Object} 景点列表
     */
    searchPoi(params) {
        const { cityName, keyword, category } = params;

        return this.executeCommand('search-poi', {
            'city-name': cityName,
            keyword,
            category,
        });
    }
}

// 导出单例
const flyaiClient = new FlyAiClient();

module.exports = {
    FlyAiClient,
    flyaiClient,
};
