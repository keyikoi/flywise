/**
 * SerpAPI Google Flights 客户端
 *
 * 用于调用 SerpAPI 获取 Google Flights 数据
 * 注意：实际使用时需要配置后端代理，避免暴露 API Key
 */

// SerpAPI 配置
const SERPAPI_CONFIG = {
    baseUrl: 'https://serpapi.com/search.json',
    engine: 'google_flights',
    // ⚠️ 注意：直接在前端配置 API Key 会暴露密钥，仅限本地开发测试
    // 生产环境请使用后端代理（见 CONFIG.md）
    apiKey: '971d8a3a79327c795ccc3d0c9a574f69ee2010eeef4e8a2f7ae9f6f35070f6cf', // TODO: 填入你的 SerpApi API Key
};

/**
 * 航班搜索参数
 * @typedef {Object} FlightSearchParams
 * @property {string} departure_id - 出发机场代码 (如 'SHA')
 * @property {string} arrival_id - 到达机场代码 (如 'TYO')
 * @property {string} outbound_date - 出发日期 (格式：'2024-01-15')
 * @property {string} [return_date] - 返程日期 (可选)
 * @property {string} [currency] - 货币单位 (默认 'CNY')
 * @property {string} [travel_class] - 舱位等级 (economy/business/first)
 */

/**
 * 标准化航班数据格式
 * @typedef {Object} Flight
 * @property {string} id - 航班唯一标识
 * @property {string} airline - 航空公司名称
 * @property {string} airline_code - 航空公司代码
 * @property {string} flight_number - 航班号
 * @property {string} origin - 出发机场代码
 * @property {string} origin_name - 出发机场名称
 * @property {string} destination - 到达机场代码
 * @property {string} destination_name - 到达机场名称
 * @property {string} depart_time - 出发时间
 * @property {string} arrive_time - 到达时间
 * @property {number} duration - 飞行时长 (分钟)
 * @property {number} price - 价格
 * @property {number} stops - 中转次数
 * @property {Array<string>} [stop_cities] - 中转城市列表
 */

/**
 * SerpAPI 客户端类
 */
class SerpApiClient {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.baseUrl = SERPAPI_CONFIG.baseUrl;
    }

    /**
     * 设置 API Key
     * @param {string} key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * 构建 SerpAPI 请求 URL
     * @param {FlightSearchParams} params
     * @returns {string}
     */
    buildUrl(params) {
        const queryParams = new URLSearchParams({
            engine: SERPAPI_CONFIG.engine,
            type: 'search',
            departure_id: params.departure_id,
            arrival_id: params.arrival_id,
            outbound_date: params.outbound_date,
            currency: params.currency || 'CNY',
            hl: 'zh-cn',
            gl: 'cn',
        });

        if (params.return_date) {
            queryParams.append('return_date', params.return_date);
        }

        if (params.travel_class) {
            queryParams.append('travel_class', params.travel_class);
        }

        if (this.apiKey) {
            queryParams.append('api_key', this.apiKey);
        }

        return `${this.baseUrl}?${queryParams.toString()}`;
    }

    /**
     * 搜索航班
     * @param {FlightSearchParams} params
     * @returns {Promise<Array<Flight>>}
     */
    async searchFlights(params) {
        if (!this.apiKey) {
            console.warn('SerpAPI Key 未配置，返回模拟数据');
            return this.getMockFlights(params);
        }

        try {
            const url = this.buildUrl(params);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`SerpAPI 请求失败：${response.status}`);
            }

            const data = await response.json();
            return this.parseFlights(data);
        } catch (error) {
            console.error('SerpAPI 搜索失败:', error);
            // 降级到模拟数据
            return this.getMockFlights(params);
        }
    }

    /**
     * 解析 SerpAPI 响应数据
     * @param {Object} data - SerpAPI 原始响应
     * @returns {Array<Flight>}
     */
    parseFlights(data) {
        const flights = [];

        if (!data || !data.flights || !Array.isArray(data.flights)) {
            return flights;
        }

        data.flights.forEach((flight, index) => {
            try {
                const parsedFlight = {
                    id: flight.flight_id || `flight-${index}-${Date.now()}`,
                    airline: flight.airline?.name || '未知航空',
                    airline_code: flight.airline?.code || '',
                    flight_number: flight.flight_number || '',
                    origin: flight.departure_airport?.airport_code || '',
                    origin_name: flight.departure_airport?.name || '',
                    destination: flight.arrival_airport?.airport_code || '',
                    destination_name: flight.arrival_airport?.name || '',
                    depart_time: this.formatTime(flight.departure_time),
                    arrive_time: this.formatTime(flight.arrival_time),
                    duration: this.formatDurationHM(flight.duration),
                    durationMinutes: this.parseDuration(flight.duration),
                    price: flight.price?.value || 0,
                    currency: flight.price?.currency || 'CNY',
                    stops: flight.stops || 0,
                    stop_cities: flight.layover_airports?.map(apt => apt.name) || [],
                    layoverDuration: this.formatLayoverDuration(flight.layover_airports, flight.departure_time, flight.arrival_time, flight.duration),
                    layoverDurationFormatted: this.formatLayoverDurationHM(flight.layover_airports, flight.departure_time, flight.arrival_time, flight.duration),
                };

                flights.push(parsedFlight);
            } catch (e) {
                console.error('解析单个航班数据失败:', e, flight);
            }
        });

        return flights;
    }

    /**
     * 格式化时间
     * @param {string} timeStr - ISO 时间字符串
     * @returns {string} HH:mm 格式
     */
    formatTime(timeStr) {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 解析时长
     * @param {string} durationStr - 时长字符串 (如 "2h 30m")
     * @returns {number} 分钟数
     */
    parseDuration(durationStr) {
        if (!durationStr) return 0;

        let minutes = 0;
        const hoursMatch = durationStr.match(/(\d+)h/);
        const minsMatch = durationStr.match(/(\d+)m/);

        if (hoursMatch) {
            minutes += parseInt(hoursMatch[1]) * 60;
        }
        if (minsMatch) {
            minutes += parseInt(minsMatch[1]);
        }

        return minutes || 150; // 默认 2.5 小时
    }

    /**
     * 格式化时长为 X 小时 Y 分 格式 (如 "4 小时 36 分")
     * @param {string} durationStr - 时长字符串 (如 "2h 30m")
     * @returns {string} X 小时 Y 分 格式
     */
    formatDurationHM(durationStr) {
        if (!durationStr) return '';

        const hoursMatch = durationStr.match(/(\d+)h/);
        const minsMatch = durationStr.match(/(\d+)m/);

        const h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const m = minsMatch ? parseInt(minsMatch[1]) : 0;

        if (h > 0 && m > 0) return `${h}小时${m}分`;
        if (h > 0) return `${h}小时`;
        return `${m}分`;
    }

    /**
     * 格式化中转时长为 X 小时 Y 分 格式
     * @param {Array} layoverAirports - 中转机场列表
     * @param {string} departTime - 出发时间 ISO 字符串
     * @param {string} arriveTime - 到达时间 ISO 字符串
     * @param {string} duration - 飞行时长 (如 "2h 30m")
     * @returns {string} X 小时 Y 分 格式
     */
    formatLayoverDuration(layoverAirports, departTime, arriveTime, duration) {
        if (!layoverAirports || layoverAirports.length === 0) return null;

        const flightMins = this.parseDuration(duration);

        // 计算总行程时间
        const departDate = new Date(departTime);
        const arriveDate = new Date(arriveTime);
        let totalMins = (arriveDate - departDate) / 1000 / 60;

        // 跨天处理
        if (totalMins < 0) totalMins += 24 * 60;

        // 中转时长 = 总时长 - 飞行时长
        const layoverMins = totalMins - flightMins;
        if (layoverMins <= 0) return '1-2 小时';

        const h = Math.floor(layoverMins / 60);
        const m = layoverMins % 60;
        return h > 0 ? `${h}小时${m}分` : `${m}分`;
    }

    /**
     * 格式化中转时长为 XhYm 格式 (如 "1h20m")
     * @param {Array} layoverAirports - 中转机场列表
     * @param {string} departTime - 出发时间 ISO 字符串
     * @param {string} arriveTime - 到达时间 ISO 字符串
     * @param {string} duration - 飞行时长 (如 "2h 30m")
     * @returns {string} XhYm 格式
     */
    formatLayoverDurationHM(layoverAirports, departTime, arriveTime, duration) {
        if (!layoverAirports || layoverAirports.length === 0) return null;

        const flightMins = this.parseDuration(duration);

        // 计算总行程时间
        const departDate = new Date(departTime);
        const arriveDate = new Date(arriveTime);
        let totalMins = (arriveDate - departDate) / 1000 / 60;

        // 跨天处理
        if (totalMins < 0) totalMins += 24 * 60;

        // 中转时长 = 总时长 - 飞行时长
        const layoverMins = totalMins - flightMins;
        if (layoverMins <= 0) return '1-2h';

        const h = Math.floor(layoverMins / 60);
        const m = layoverMins % 60;
        return h > 0 ? `${h}h${m}m` : `${m}m`;
    }

    /**
     * 获取模拟航班数据（用于开发和降级）
     * @param {Array} layoverAirports - 中转机场列表
     * @param {string} departTime - 出发时间 ISO 字符串
     * @param {string} arriveTime - 到达时间 ISO 字符串
     * @param {string} duration - 飞行时长 (如 "2h 30m")
     * @returns {string} 中转时长 (如 "1 小时 30 分")
     */
    formatLayoverDuration(layoverAirports, departTime, arriveTime, duration) {
        if (!layoverAirports || layoverAirports.length === 0) return null;

        const flightMins = this.parseDuration(duration);

        // 计算总行程时间
        const departDate = new Date(departTime);
        const arriveDate = new Date(arriveTime);
        let totalMins = (arriveDate - departDate) / 1000 / 60;

        // 跨天处理
        if (totalMins < 0) totalMins += 24 * 60;

        // 中转时长 = 总时长 - 飞行时长
        const layoverMins = totalMins - flightMins;
        if (layoverMins <= 0) return '1-2 小时';

        const h = Math.floor(layoverMins / 60);
        const m = layoverMins % 60;
        return h > 0 ? `${h}小时${m}分` : `${m}分`;
    }

    /**
     * 获取模拟航班数据（用于开发和降级）
     * @param {FlightSearchParams} params
     * @returns {Array<Flight>}
     */
    getMockFlights(params) {
        const mockFlights = [
            {
                id: `mock-1-${Date.now()}`,
                airline: '日本航空',
                airline_code: 'JL',
                flight_number: 'JL896',
                origin: params.departure_id || 'SHA',
                origin_name: '上海浦东',
                destination: params.arrival_id || 'TYO',
                destination_name: '东京羽田',
                depart_time: '09:30',
                arrive_time: '14:45',
                duration: '4h15m',
                durationFormatted: '4 小时 15 分',
                durationMinutes: 255,
                price: 2580 + Math.floor(Math.random() * 500),
                currency: 'CNY',
                stops: 0,
                stop_cities: [],
                layoverDuration: null,
            },
            {
                id: `mock-2-${Date.now()}`,
                airline: '全日空',
                airline_code: 'NH',
                flight_number: 'NH928',
                origin: params.departure_id || 'SHA',
                origin_name: '上海浦东',
                destination: params.arrival_id || 'TYO',
                destination_name: '东京羽田',
                depart_time: '13:20',
                arrive_time: '18:10',
                duration: '3h50m',
                durationFormatted: '3 小时 50 分',
                durationMinutes: 230,
                price: 2890 + Math.floor(Math.random() * 400),
                currency: 'CNY',
                stops: 0,
                stop_cities: [],
                layoverDuration: null,
            },
            {
                id: `mock-3-${Date.now()}`,
                airline: '中国东方航空',
                airline_code: 'MU',
                flight_number: 'MU523',
                origin: params.departure_id || 'SHA',
                origin_name: '上海浦东',
                destination: params.arrival_id || 'TYO',
                destination_name: '东京羽田',
                depart_time: '17:55',
                arrive_time: '22:00',
                duration: '4h5m',
                durationFormatted: '4 小时 5 分',
                durationMinutes: 245,
                price: 2180 + Math.floor(Math.random() * 600),
                currency: 'CNY',
                stops: 0,
                stop_cities: [],
                layoverDuration: null,
            },
            {
                id: `mock-4-${Date.now()}`,
                airline: '南方航空',
                airline_code: 'CZ',
                flight_number: 'CZ345',
                origin: params.departure_id || 'SHA',
                origin_name: '上海浦东',
                destination: params.arrival_id || 'TYO',
                destination_name: '东京羽田',
                depart_time: '08:15',
                arrive_time: '14:30',
                duration: '6h15m',
                durationFormatted: '6 小时 15 分',
                durationMinutes: 375,
                price: 1890 + Math.floor(Math.random() * 300),
                currency: 'CNY',
                stops: 1,
                stop_cities: ['广州'],
                layoverDuration: '2 小时 30 分',
                layoverDurationFormatted: '2h30m',
            },
        ];

        return mockFlights;
    }
}

// 导出单例（避免重复声明）
if (!window.serpApiClient) {
    window.serpApiClient = new SerpApiClient();
}
if (!window.SerpApiClient) {
    window.SerpApiClient = SerpApiClient;
}

// 支持模块化和全局使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SerpApiClient, serpApiClient: window.serpApiClient };
}
