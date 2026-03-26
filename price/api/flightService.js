/**
 * 航班服务统一接口层
 *
 * 整合 SerpAPI、FlyAI 和自有价格历史数据
 * 根据目的地自动选择最优数据源
 */

const { serpApiClient } = require('./serpapiClient');
const { flyaiClient } = require('./flyaiClient');
const { getPriceHistory: getDomesticPriceHistory } = require('../data/priceHistory');

/**
 * 数据源配置
 */
const DataSource = {
    SERPAPI: 'serpapi',      // Google Flights (国际航班更优)
    FLYAI: 'flyai',          // 飞猪 (国内/亚洲航班更优)
    BOTH: 'both',            // 同时查询两个数据源
};

/**
 * 航班服务类
 */
class FlightService {
    constructor() {
        this.serpClient = serpApiClient;
        this.flyaiClient = flyaiClient;
        // 默认数据源策略：根据目的地自动选择
        this.defaultStrategy = 'auto';
    }

    /**
     * 根据目的地判断使用的数据源
     * 规则：只有出发地和目的地都是中国城市时，才使用 FlyAI（国内航线）
     * 其他所有情况（包括亚洲国际、国际长途）都使用 SerpAPI
     * @param {string} origin - 出发地
     * @param {string} destination - 目的地
     * @returns {string} 数据源名称
     */
    selectDataSource(origin, destination) {
        // 中国城市列表（出发地和目的地都是中国城市才算国内航线）
        const chineseCities = [
            // 机场代码
            'PEK', 'PVG', 'SHA', 'CAN', 'SZX', 'CTU', 'XIY', 'KMG', 'HGH', 'NKG',
            'CSX', 'WUH', 'TAO', 'TSN', 'CGO', 'FOC', 'XMN', 'NNG', 'KWL', 'SYX',
            'HAK', 'LHW', 'INC', 'LXA', 'URC', 'DLC', 'SHE', 'CGQ', 'HRB', 'JHG',
            'NBS', 'PKX', 'TFU', 'CKG', 'LZY', 'XNN', 'YNT', 'WEH', 'LYG',
            // 城市中文名
            '北京', '上海', '广州', '深圳', '成都', '西安', '昆明', '杭州', '南京',
            '长沙', '武汉', '青岛', '天津', '郑州', '福州', '厦门', '南宁', '桂林',
            '三亚', '海口', '兰州', '银川', '拉萨', '乌鲁木齐', '大连', '沈阳',
            '长春', '哈尔滨', '景洪', '长白山', '西宁', '重庆', '台北', '香港',
        ];

        // 判断是否是中国城市
        const isChineseCity = (city) => {
            return chineseCities.some(d => city.includes(d));
        };

        // 只有出发地和目的地都是中国城市，才使用 FlyAI（国内航线）
        if (isChineseCity(origin) && isChineseCity(destination)) {
            console.log(`[FlightService] 国内航线：${origin} -> ${destination}，使用 FlyAI`);
            return DataSource.FLYAI;
        }

        // 其他所有情况（国际航线）使用 SerpAPI
        console.log(`[FlightService] 国际航线：${origin} -> ${destination}，使用 SerpAPI`);
        return DataSource.SERPAPI;
    }

    /**
     * 搜索航班（统一接口）
     * @param {Object} params - 搜索参数
     * @param {string} params.origin - 出发地
     * @param {string} params.destination - 目的地
     * @param {string} params.departDate - 出发日期
     * @param {string} [params.returnDate] - 返程日期
     * @param {string} [params.dataSource] - 数据源 ('auto' | 'serpapi' | 'flyai' | 'both')
     * @returns {Promise<Object>} 搜索结果
     */
    async searchFlights(params) {
        const {
            origin,
            destination,
            departDate,
            returnDate,
            dataSource = this.defaultStrategy,
        } = params;

        console.log(`[FlightService] 搜索航班：${origin} -> ${destination}, ${departDate}`);

        // 根据策略选择数据源
        let source = dataSource;
        if (dataSource === 'auto' || dataSource === 'adaptive') {
            source = this.selectDataSource(origin, destination);
            console.log(`[FlightService] 自动选择数据源：${source}`);
        }

        // 同时查询两个数据源
        if (source === DataSource.BOTH) {
            return this.searchBoth(params);
        }

        // 使用 FlyAI
        if (source === DataSource.FLYAI) {
            return this.searchWithFlyAi(params);
        }

        // 使用 SerpAPI
        return this.searchWithSerpApi(params);
    }

    /**
     * 使用 FlyAI 搜索航班
     * @param {Object} params - 搜索参数
     * @returns {Promise<Object>} 搜索结果
     */
    async searchWithFlyAi(params) {
        console.log(`[FlightService] 使用 FlyAI 搜索`);

        try {
            const flights = this.flyaiClient.searchFlights({
                origin: params.origin,
                destination: params.destination,
                depDate: params.departDate,
                returnDate: params.returnDate,
            });

            return {
                success: true,
                source: 'flyai',
                flights,
                total: flights.length,
            };
        } catch (error) {
            console.error(`[FlightService] FlyAI 搜索失败：${error.message}`);
            return {
                success: false,
                source: 'flyai',
                error: error.message,
                flights: [],
                total: 0,
            };
        }
    }

    /**
     * 使用 SerpAPI 搜索航班（直接调用 SerpAPI，不通过浏览器客户端）
     * @param {Object} params - 搜索参数
     * @returns {Promise<Object>} 搜索结果
     */
    async searchWithSerpApi(params) {
        console.log(`[FlightService] 使用 SerpAPI 搜索`);

        try {
            // 将城市名转换为机场代码
            const airportParams = await this.resolveAirports(params);

            // 直接调用 SerpAPI（需要 SERPAPI_KEY）
            const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
            if (!SERPAPI_KEY) {
                throw new Error('SerpAPI Key 未配置');
            }

            const searchUrl = `https://serpapi.com/search.json?` + new URLSearchParams({
                engine: 'google_flights',
                api_key: SERPAPI_KEY,
                departure_id: airportParams.departure_id,
                arrival_id: airportParams.arrival_id,
                outbound_date: params.departDate,
                return_date: params.returnDate,
                currency: 'CNY',
                hl: 'zh-cn',
                type: '2',
            }).toString();

            const response = await fetch(searchUrl);
            const data = await response.json();

            if (!response.ok || !data.best_flights) {
                throw new Error(data.error || 'SerpAPI 请求失败');
            }

            // 解析航班数据（简化版本）
            const flights = this.parseSerpApiFlights(data);

            return {
                success: true,
                source: 'serpapi',
                flights,
                total: flights.length,
                priceInsights: data.price_insights || null,
            };
        } catch (error) {
            console.error(`[FlightService] SerpAPI 搜索失败：${error.message}`);
            return {
                success: false,
                source: 'serpapi',
                error: error.message,
                flights: [],
                total: 0,
            };
        }
    }

    /**
     * 解析 SerpAPI 航班数据
     * @param {Object} data - SerpAPI 响应
     * @returns {Array} 航班列表
     */
    parseSerpApiFlights(data) {
        const flights = [];
        const allFlights = [...(data.best_flights || []), ...(data.other_flights || [])];

        allFlights.forEach((group, index) => {
            const firstLeg = group.flights?.[0];
            const lastLeg = group.flights?.[group.flights.length - 1];
            if (!firstLeg) return;

            flights.push({
                id: `serpapi-${index}-${Date.now()}`,
                source: 'serpapi',
                airline: firstLeg.airline || '未知航空',
                airline_code: firstLeg.airline?.substring(0, 2) || '',
                flight_number: firstLeg.flight_number || '',
                origin: firstLeg.departure_airport?.id || '',
                destination: lastLeg.arrival_airport?.id || '',
                depart_time: firstLeg.departure_airport?.time?.split(' ')[1] || '',
                arrive_time: lastLeg.arrival_airport?.time?.split(' ')[1] || '',
                price: group.price || 0,
                currency: 'CNY',
                stops: group.flights.length - 1,
                jumpUrl: group.flight_booking_link || '',
            });
        });

        return flights;
    }

    /**
     * 同时查询两个数据源并合并结果
     * @param {Object} params - 搜索参数
     * @returns {Promise<Object>} 合并后的搜索结果
     */
    async searchBoth(params) {
        console.log(`[FlightService] 同时查询两个数据源`);

        const [flyaiResult, serpResult] = await Promise.all([
            this.searchWithFlyAi(params),
            this.searchWithSerpApi(params),
        ]);

        // 合并航班列表
        const allFlights = [
            ...(flyaiResult.flights || []),
            ...(serpResult.flights || []),
        ];

        // 按价格排序
        allFlights.sort((a, b) => (a.price || 0) - (b.price || 0));

        return {
            success: true,
            source: 'both',
            flights: allFlights,
            total: allFlights.length,
            breakdown: {
                flyai: flyaiResult.flights?.length || 0,
                serpapi: serpResult.flights?.length || 0,
            },
        };
    }

    /**
     * 解析机场参数
     * @param {Object} params - 搜索参数
     * @returns {Promise<Object>} 机场代码参数
     */
    async resolveAirports(params) {
        // 机场代码映射表
        const airportMap = {
            '上海': 'PVG',
            '上海浦东': 'PVG',
            '上海虹桥': 'SHA',
            'SHA': 'SHA',
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

        const resolveAirport = (input) => {
            if (!input) return 'PVG';
            // 如果已经是机场代码（3 个大写字母），直接返回
            if (/^[A-Z]{3}$/.test(input)) {
                return input;
            }
            return airportMap[input] || airportMap[input.toUpperCase()] || 'PVG';
        };

        const departure_id = resolveAirport(params.origin);
        const arrival_id = resolveAirport(params.destination);

        return { departure_id, arrival_id };
    }

    /**
     * 快速搜索（全品类旅游产品）
     * @param {string} query - 自然语言查询
     * @returns {Object} 搜索结果
     */
    fastSearch(query) {
        console.log(`[FlightService] 快速搜索：${query}`);
        return this.flyaiClient.fastSearch(query);
    }

    /**
     * 搜索酒店
     * @param {Object} params - 搜索参数
     * @returns {Object} 酒店列表
     */
    searchHotels(params) {
        console.log(`[FlightService] 搜索酒店：${params.destName}`);
        return this.flyaiClient.searchHotels(params);
    }

    /**
     * 搜索景点
     * @param {Object} params - 搜索参数
     * @returns {Object} 景点列表
     */
    searchPoi(params) {
        console.log(`[FlightService] 搜索景点：${params.cityName}`);
        return this.flyaiClient.searchPoi(params);
    }

    /**
     * 获取价格历史（整合自有数据和 SerpAPI）
     * @param {Object} params - 查询参数
     * @param {string} params.origin - 出发地
     * @param {string} params.destination - 目的地
     * @param {string} params.date - 日期
     * @param {string} params.dataSource - 数据源 ('auto' | 'domestic' | 'serpapi')
     * @returns {Promise<Object>} 价格历史分析
     */
    async getPriceHistory(params) {
        const { origin, destination, date, dataSource = 'auto' } = params;

        // 判断是否是国内航线
        const isDomestic = this.isDomesticRoute(origin, destination);

        // 国内航线优先使用自有数据
        if (dataSource === 'auto' && isDomestic) {
            console.log(`[FlightService] 使用自有价格历史数据：${origin} -> ${destination}`);
            const domesticHistory = await getDomesticPriceHistory({
                origin,
                destination,
                date,
            });

            if (domesticHistory) {
                return domesticHistory;
            }
        }

        // 国际航线或自有数据不存在时，使用 SerpAPI
        console.log(`[FlightService] 使用 SerpAPI 价格历史：${origin} -> ${destination}`);
        return this.getSerpApiPriceHistory(params);
    }

    /**
     * 判断是否是国内航线（出发地和目的地都是中国城市）
     * @param {string} origin - 出发地
     * @param {string} destination - 目的地
     * @returns {boolean}
     */
    isDomesticRoute(origin, destination) {
        // 中国城市列表
        const chineseCities = [
            // 机场代码
            'PEK', 'PVG', 'SHA', 'CAN', 'SZX', 'CTU', 'XIY', 'KMG', 'HGH', 'NKG',
            'CSX', 'WUH', 'TAO', 'TSN', 'CGO', 'FOC', 'XMN', 'NNG', 'KWL', 'SYX',
            'HAK', 'LHW', 'INC', 'LXA', 'URC', 'DLC', 'SHE', 'CGQ', 'HRB', 'JHG',
            'NBS', 'PKX', 'TFU', 'CKG', 'LZY', 'XNN', 'YNT', 'WEH', 'LYG',
            // 城市中文名
            '北京', '上海', '广州', '深圳', '成都', '西安', '昆明', '杭州', '南京',
            '长沙', '武汉', '青岛', '天津', '郑州', '福州', '厦门', '南宁', '桂林',
            '三亚', '海口', '兰州', '银川', '拉萨', '乌鲁木齐', '大连', '沈阳',
            '长春', '哈尔滨', '景洪', '长白山', '西宁', '重庆',
        ];

        const isChinese = (city) => chineseCities.some(d => city.includes(d));

        // 只有出发地和目的地都是中国城市，才是国内航线
        return isChinese(origin) && isChinese(destination);
    }

    /**
     * 从 SerpAPI 获取价格历史
     * @param {Object} params - 查询参数
     * @returns {Promise<Object>} 价格历史分析
     */
    async getSerpApiPriceHistory(params) {
        const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
        if (!SERPAPI_KEY) {
            console.log('[FlightService] SerpAPI Key 未配置，跳过价格历史查询');
            return null;
        }

        try {
            const airportParams = await this.resolveAirports(params);

            const searchUrl = `https://serpapi.com/search.json?` + new URLSearchParams({
                engine: 'google_flights',
                api_key: SERPAPI_KEY,
                departure_id: airportParams.departure_id,
                arrival_id: airportParams.arrival_id,
                outbound_date: params.date || params.departDate,
                currency: 'CNY',
                hl: 'zh-cn',
                type: '2',
            }).toString();

            const response = await fetch(searchUrl);
            const data = await response.json();

            if (!response.ok || !data.price_insights?.price_history) {
                return null;
            }

            const insights = data.price_insights;
            const priceHistory = insights.price_history.map(([timestamp, price]) => ({
                date: new Date(timestamp * 1000).toISOString().split('T')[0],
                price,
            }));

            const prices = priceHistory.map(p => p.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            const currentPrice = prices[prices.length - 1] || insights.lowest_price;

            const priceLevel = currentPrice <= avgPrice * 0.9 ? 'low' :
                               currentPrice >= avgPrice * 1.1 ? 'high' : 'medium';

            return {
                currentPrice,
                minPrice,
                maxPrice,
                avgPrice,
                priceLevel,
                priceHistory,
                dataSource: 'SerpAPI',
            };
        } catch (error) {
            console.error('[FlightService] SerpAPI 价格历史获取失败:', error.message);
            return null;
        }
    }
}

// 导出单例
const flightService = new FlightService();

module.exports = {
    FlightService,
    flightService,
    DataSource,
};
