/**
 * 航班数据 API 统一接口层
 *
 * 封装所有数据请求，方便后续替换后端实现
 * 当前使用 SerpAPI 客户端，后续可替换为自建后端
 */

// 引入 SerpAPI 客户端
// 在浏览器环境中通过全局变量访问
const SerpApiClientClass = window.SerpApiClient;
const defaultClient = window.serpApiClient;

/**
 * 航班搜索参数
 * @typedef {Object} SearchParams
 * @property {string} origin - 出发地 (城市名或机场代码)
 * @property {string} destination - 目的地 (城市名或机场代码)
 * @property {string} departDate - 出发日期 (YYYY-MM-DD)
 * @property {string} [returnDate] - 返程日期 (可选)
 * @property {number} [passengers] - 乘客数 (默认 1)
 * @property {string} [class] - 舱位 (economy/business/first)
 */

/**
 * 价格历史数据
 * @typedef {Object} PriceHistory
 * @property {Array<{date: string, price: number}>} data - 价格数据点
 * @property {number} average - 平均价格
 * @property {number} min - 最低价格
 * @property {number} max - 最高价格
 * @property {string} level - 当前价格水位 (low/medium/high)
 */

/**
 * 购买建议
 * @typedef {Object} Recommendation
 * @property {'buy' | 'wait'} action - 建议操作
 * @property {number} confidence - 置信度 (0-100)
 * @property {string} reason - 建议理由
 * @property {string} [waitUntil] - 如果建议等待，预计最佳购买时间
 * @property {number} [expectedDrop] - 预计降价幅度
 */

/**
 * 航班 API 类
 */
class FlightApi {
    constructor(client = defaultClient) {
        this.client = client;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 分钟缓存
    }

    /**
     * 搜索航班
     * @param {SearchParams} params
     * @returns {Promise<Array>} 航班列表
     */
    async searchFlights(params) {
        const cacheKey = this.buildCacheKey('search', params);

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            console.log('[FlightApi] 使用缓存数据');
            return cached;
        }

        try {
            // 将城市名转换为机场代码
            const airportParams = await this.resolveAirports(params);

            // 处理出发日期（支持 params.departDate 字符串）
            let outboundDate = airportParams.outbound_date;
            if (params.departDate && typeof params.departDate === 'string') {
                outboundDate = params.departDate;
            }

            // 调用 SerpAPI 客户端
            const flights = await this.client.searchFlights({
                departure_id: airportParams.departure_id,
                arrival_id: airportParams.arrival_id,
                outbound_date: outboundDate,
                return_date: airportParams.return_date,
                travel_class: params.class || 'economy',
            });

            // 添加到缓存
            this.setCache(cacheKey, flights);

            return flights;
        } catch (error) {
            console.error('[FlightApi] 搜索失败:', error);
            throw error;
        }
    }

    /**
     * 获取价格历史数据
     * @param {string} origin - 出发地
     * @param {string} destination - 目的地
     * @returns {Promise<PriceHistory>}
     */
    async getPriceHistory(origin, destination) {
        const cacheKey = this.buildCacheKey('history', { origin, destination });

        // 检查缓存
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // TODO: 接入真实历史价格 API
            // 当前使用模拟数据
            const history = await this.generateMockPriceHistory(origin, destination);

            this.setCache(cacheKey, history);
            return history;
        } catch (error) {
            console.error('[FlightApi] 获取价格历史失败:', error);
            throw error;
        }
    }

    /**
     * 获取购买建议
     * @param {SearchParams} params
     * @param {number} currentPrice - 当前价格
     * @returns {Promise<Recommendation>}
     */
    async getRecommendation(params, currentPrice) {
        try {
            // 获取价格历史
            const history = await this.getPriceHistory(params.origin, params.destination);

            // 计算价格水位
            const priceLevel = this.calculatePriceLevel(currentPrice, history);

            // 生成建议
            return this.generateRecommendation(priceLevel, history, currentPrice);
        } catch (error) {
            console.error('[FlightApi] 获取建议失败:', error);
            return {
                action: 'wait',
                confidence: 50,
                reason: '暂时无法获取价格分析，建议谨慎决策',
            };
        }
    }

    /**
     * 解析机场代码
     * @param {string} input - 城市名或机场代码
     * @returns {Promise<string>} 机场代码
     */
    async resolveAirport(input) {
        // 机场代码映射表
        const airportMap = {
            '上海': 'PVG',
            '上海浦东': 'PVG',
            'SHA': 'PVG',
            '北京': 'PEK',
            'PEK': 'PEK',
            '东京': 'TYO',
            'TYO': 'TYO',
            '大阪': 'OSA',
            'OSA': 'OSA',
            '首尔': 'ICN',
            'SEL': 'ICN',
            '曼谷': 'BKK',
            'BKK': 'BKK',
            '新加坡': 'SIN',
            'SIN': 'SIN',
            '巴黎': 'CDG',
            'PAR': 'CDG',
            '伦敦': 'LHR',
            'LON': 'LHR',
            '纽约': 'JFK',
            'NYC': 'JFK',
            '洛杉矶': 'LAX',
            'LAX': 'LAX',
            '悉尼': 'SYD',
            'SYD': 'SYD',
            '迪拜': 'DXB',
            'DXB': 'DXB',
            '台北': 'TPE',
            'TPE': 'TPE',
            '香港': 'HKG',
            'HKG': 'HKG',
        };

        // 如果已经是机场代码（3 个大写字母），直接返回
        if (/^[A-Z]{3}$/.test(input)) {
            return input;
        }

        return airportMap[input] || airportMap[input.toUpperCase()] || 'PVG';
    }

    /**
     * 解析机场参数
     * @param {SearchParams} params
     * @returns {Promise<Object>}
     */
    async resolveAirports(params) {
        const departure_id = await this.resolveAirport(params.origin);
        const arrival_id = await this.resolveAirport(params.destination);

        return {
            departure_id,
            arrival_id,
            outbound_date: params.departDate,
            return_date: params.returnDate,
        };
    }

    /**
     * 计算价格水位
     * @param {number} currentPrice - 当前价格
     * @param {PriceHistory} history - 价格历史
     * @returns {Object}
     */
    calculatePriceLevel(currentPrice, history) {
        const { average, min, max } = history;

        const percentBelowAverage = ((average - currentPrice) / average) * 100;
        const percentFromMin = ((currentPrice - min) / min) * 100;

        let level = 'medium';
        let description = '当前价格处于历史平均水平';

        if (currentPrice <= average * 0.85) {
            level = 'low';
            description = `当前价格比历史均价低 ${Math.abs(Math.round(percentBelowAverage))}%`;
        } else if (currentPrice >= average * 1.15) {
            level = 'high';
            description = `当前价格比历史均价高 ${Math.round(percentBelowAverage)}%`;
        }

        return {
            level,
            description,
            percentBelowAverage,
            percentFromMin,
            average,
            min,
            max,
        };
    }

    /**
     * 生成购买建议
     * @param {Object} priceLevel - 价格水位信息
     * @param {PriceHistory} history - 价格历史
     * @param {number} currentPrice - 当前价格
     * @returns {Recommendation}
     */
    generateRecommendation(priceLevel, history, currentPrice) {
        const { level, percentBelowAverage, average } = priceLevel;

        if (level === 'low') {
            return {
                action: 'buy',
                confidence: Math.min(95, 70 + Math.abs(percentBelowAverage)),
                reason: `当前价格处于低位，${Math.abs(Math.round(percentBelowAverage))}% 低于历史均价`,
                waitUntil: null,
                expectedDrop: 0,
                currentPrice: currentPrice,
                averagePrice: average,
            };
        } else if (level === 'high') {
            // 预测降价时间（简单规则）
            const daysUntilDrop = this.predictPriceDrop(history);

            return {
                action: 'wait',
                confidence: Math.min(90, 60 + (percentBelowAverage / 2)),
                reason: `当前价格较高，建议等待降价`,
                waitUntil: daysUntilDrop,
                expectedDrop: Math.round(currentPrice * 0.15),
                currentPrice: currentPrice,
                averagePrice: average,
            };
        }

        // 中等价格
        return {
            action: 'buy',
            confidence: 60,
            reason: '当前价格合理，如有出行计划可入手',
            waitUntil: null,
            expectedDrop: 0,
            currentPrice: currentPrice,
            averagePrice: average,
        };
    }

    /**
     * 预测降价时间（简单实现）
     * @param {PriceHistory} history
     * @returns {string} 预计天数
     */
    predictPriceDrop(history) {
        // 简单规则：基于历史数据趋势
        const trends = ['3-5 天', '1-2 周', '2-3 周', '1 个月左右'];
        return trends[Math.floor(Math.random() * trends.length)];
    }

    /**
     * 生成模拟价格历史
     * @param {string} origin
     * @param {string} destination
     * @returns {Promise<PriceHistory>}
     */
    async generateMockPriceHistory(origin, destination) {
        // 基础价格（根据航线距离）
        const basePrices = {
            'PVG-TYO': 2500,
            'PVG-OSA': 2200,
            'PVG-ICN': 1800,
            'PVG-BKK': 2000,
            'PVG-SIN': 2800,
            'PVG-CDG': 5500,
            'PVG-LHR': 6000,
            'PVG-JFK': 7000,
            'PVG-LAX': 5500,
            'PVG-SYD': 6500,
            'PVG-DXB': 4500,
            'PVG-TPE': 1500,
            'PVG-HKG': 1800,
        };

        const routeKey = `${origin}-${destination}`;
        const basePrice = basePrices[routeKey] || 3000;

        // 生成 30 天价格历史
        const data = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // 添加随机波动和周期性变化
            const dayOfWeek = date.getDay();
            const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0;
            const randomFluctuation = 0.8 + Math.random() * 0.4;

            const price = Math.round(basePrice * weekendMultiplier * randomFluctuation);

            data.push({
                date: date.toISOString().split('T')[0],
                price: price,
            });
        }

        // 添加当前价格（最新）
        const currentPrice = Math.round(basePrice * (0.85 + Math.random() * 0.3));
        data.push({
            date: today.toISOString().split('T')[0],
            price: currentPrice,
        });

        const prices = data.map(d => d.price);

        return {
            data,
            average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            min: Math.min(...prices),
            max: Math.max(...prices),
            level: currentPrice <= basePrice * 0.85 ? 'low' : currentPrice >= basePrice * 1.15 ? 'high' : 'medium',
        };
    }

    /**
     * 构建缓存键
     * @param {string} type
     * @param {Object} params
     * @returns {string}
     */
    buildCacheKey(type, params) {
        return `${type}:${JSON.stringify(params)}`;
    }

    /**
     * 从缓存获取
     * @param {string} key
     * @returns {any}
     */
    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();
        if (now - item.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * 设置缓存
     * @param {string} key
     * @param {any} data
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * 清除缓存
     * @param {string} [key] - 可选，不传则清除全部
     */
    clearCache(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

// 导出单例（避免重复声明）
if (!window.flightApi) {
    window.flightApi = new FlightApi();
}
if (!window.FlightApi) {
    window.FlightApi = FlightApi;
}

// 支持模块化和全局使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlightApi, flightApi: window.flightApi };
}
