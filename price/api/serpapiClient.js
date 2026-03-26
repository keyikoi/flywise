/**
 * SerpAPI Google Flights 客户端
 *
 * 用于调用 SerpAPI 获取 Google Flights 数据
 * 注意：实际使用时需要配置后端代理，避免暴露 API Key
 */

// SerpAPI 配置
const SERPAPI_CONFIG = {
    // 使用后端代理服务器，解决 CORS 问题且保护 API Key
    baseUrl: '/api/flights/search',
    engine: 'google_flights',
    // API Key 已由后端管理，前端不再需要配置
    apiKey: '', // 保留字段以兼容旧代码
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
    constructor(apiKey = SERPAPI_CONFIG.apiKey || '') {
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
        try {
            // 使用 POST 请求发送到后端代理
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    departure_id: params.departure_id,
                    arrival_id: params.arrival_id,
                    outbound_date: params.outbound_date,
                    return_date: params.return_date,
                    currency: params.currency || 'CNY',
                    travel_class: params.travel_class ? this.getTravelClassCode(params.travel_class) : 1,
                }),
            });

            if (!response.ok) {
                throw new Error(`后端代理请求失败：${response.status}`);
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
     * 将舱位等级转换为数字代码
     * @param {string} travelClass - economy/business/first
     * @returns {number} 1: 经济舱, 2: 高端经济舱, 3: 商务舱, 4: 头等舱
     */
    getTravelClassCode(travelClass) {
        const classMap = {
            'economy': 1,
            'premium_economy': 2,
            'business': 3,
            'first': 4,
        };
        return classMap[travelClass] || 1;
    }

    /**
     * 解析 SerpAPI 响应数据
     * @param {Object} data - SerpAPI 原始响应
     * @returns {Array<Flight>}
     */
    parseFlights(data) {
        const flights = [];

        if (!data) {
            return flights;
        }

        // 真实 SerpAPI 响应结构：best_flights 和 other_flights
        const bestFlights = data.best_flights || [];
        const otherFlights = data.other_flights || [];
        const realApiFlights = [...bestFlights, ...otherFlights];

        // 如果有真实 API 数据，使用真实 API 解析
        if (realApiFlights.length > 0) {
            realApiFlights.forEach((flightGroup, index) => {
                try {
                    const parsedFlight = this.parseRealApiFlight(flightGroup, index);
                    if (parsedFlight) {
                        flights.push(parsedFlight);
                    }
                } catch (e) {
                    console.error('解析真实 API 航班数据失败:', e, flightGroup);
                }
            });
            return flights;
        }

        // Fallback: 兼容旧的 data.flights 格式（模拟数据）
        if (data.flights && Array.isArray(data.flights)) {
            data.flights.forEach((flight, index) => {
                try {
                    const parsedFlight = this.parseLegacyFlight(flight, index);
                    if (parsedFlight) {
                        flights.push(parsedFlight);
                    }
                } catch (e) {
                    console.error('解析模拟航班数据失败:', e, flight);
                }
            });
        }

        return flights;
    }

    /**
     * 解析真实 SerpAPI 航班数据（best_flights/other_flights 格式）
     * @param {Object} flightGroup - 航班组数据
     * @param {number} index - 索引
     * @returns {Flight}
     */
    parseRealApiFlight(flightGroup, index) {
        // 获取航段信息（flights 数组中的第一个航段为出发信息，最后一个为到达信息）
        const segments = flightGroup.flights || [];
        if (segments.length === 0) return null;

        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        // 解析起降时间（格式："2024-01-15 08:00"）
        const departTime = this.parseFlightTime(firstSegment.departure_airport?.time);
        const arriveTime = this.parseFlightTime(lastSegment.arrival_airport?.time);

        // 解析中转信息
        const layovers = flightGroup.layovers || [];
        const stopCities = layovers.map(l => l.name);
        const totalLayoverMinutes = layovers.reduce((sum, l) => sum + (l.duration || 0), 0);

        // 计算总飞行时长（分钟）
        const totalDuration = flightGroup.total_duration || 
            segments.reduce((sum, seg) => sum + (seg.duration || 0), 0);

        return {
            id: `flight-${index}-${Date.now()}`,
            airline: firstSegment.airline || '未知航空',
            airline_code: firstSegment.airline_logo ? '' : '',
            flight_number: segments.map(s => s.flight_number).filter(Boolean).join('/') || '',
            origin: firstSegment.departure_airport?.id || '',
            origin_name: firstSegment.departure_airport?.name || '',
            destination: lastSegment.arrival_airport?.id || '',
            destination_name: lastSegment.arrival_airport?.name || '',
            depart_time: departTime,
            arrive_time: arriveTime,
            duration: this.formatMinutesToHM(totalDuration),
            durationFormatted: this.formatMinutesToChinese(totalDuration),
            durationMinutes: totalDuration,
            price: flightGroup.price || 0,
            currency: 'CNY',
            stops: layovers.length,
            stop_cities: stopCities,
            layoverDuration: totalLayoverMinutes > 0 ? this.formatMinutesToChinese(totalLayoverMinutes) : null,
            layoverDurationFormatted: totalLayoverMinutes > 0 ? this.formatMinutesToHM(totalLayoverMinutes) : null,
        };
    }

    /**
     * 解析旧格式航班数据（兼容模拟数据）
     * @param {Object} flight - 航班数据
     * @param {number} index - 索引
     * @returns {Flight}
     */
    parseLegacyFlight(flight, index) {
        return {
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
    }

    /**
     * 解析航班时间字符串（格式："2024-01-15 08:00"）
     * @param {string} timeStr - 时间字符串
     * @returns {string} HH:mm 格式
     */
    parseFlightTime(timeStr) {
        if (!timeStr) return '';
        // 提取时间部分 "HH:mm"
        const match = timeStr.match(/(\d{2}):(\d{2})/);
        if (match) {
            return `${match[1]}:${match[2]}`;
        }
        return '';
    }

    /**
     * 将分钟数格式化为 XhYm 格式
     * @param {number} minutes - 分钟数
     * @returns {string} XhYm 格式
     */
    formatMinutesToHM(minutes) {
        if (!minutes || minutes <= 0) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}h${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    }

    /**
     * 将分钟数格式化为中文格式
     * @param {number} minutes - 分钟数
     * @returns {string} X小时Y分 格式
     */
    formatMinutesToChinese(minutes) {
        if (!minutes || minutes <= 0) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0 && m > 0) return `${h}小时${m}分`;
        if (h > 0) return `${h}小时`;
        return `${m}分`;
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

// 导出单例（支持浏览器和 Node.js 环境）
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
    if (!window.serpApiClient) {
        window.serpApiClient = new SerpApiClient();
    }
    if (!window.SerpApiClient) {
        window.SerpApiClient = SerpApiClient;
    }
}

// 支持模块化和全局使用
if (typeof module !== 'undefined' && module.exports) {
    const instance = isBrowser ? window.serpApiClient : new SerpApiClient();
    module.exports = { SerpApiClient, serpApiClient: instance };
}
