/**
 * 国内航班价格历史数据服务
 *
 * 基于自有的航班数据表，提供价格历史查询功能
 * 数据来源：航班班次表.xlsx -> price_history.json
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'price_history.json');

/**
 * 价格历史数据缓存
 */
let priceHistoryCache = {
    data: null,
    loaded: false,
    timestamp: 0,
};

/**
 * 加载价格历史数据
 * @returns {Promise<Array>} 价格历史数据
 */
async function loadPriceHistory() {
    if (priceHistoryCache.loaded && priceHistoryCache.data) {
        return priceHistoryCache.data;
    }

    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.log('[PriceHistory] 数据文件不存在');
            priceHistoryCache.data = { raw: [], grouped: {} };
            priceHistoryCache.loaded = true;
            return priceHistoryCache.data;
        }

        // 大文件使用流式读取，避免内存溢出
        console.log('[PriceHistory] 开始加载数据文件...');
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

        // 按航线和日期分组，每天取最低价航班
        const grouped = {};
        data.forEach(item => {
            const key = `${item.origin}-${item.destination}`;
            const date = item.flightDate;

            if (!grouped[key]) {
                grouped[key] = {};
            }

            // 如果这天还没有记录，或者当前航班价格更低，则更新
            if (!grouped[key][date] || item.avgPrice < grouped[key][date].avgPrice) {
                grouped[key][date] = item;
            }
        });

        priceHistoryCache.data = { raw: data, grouped };
        priceHistoryCache.loaded = true;
        priceHistoryCache.timestamp = Date.now();
        console.log(`[PriceHistory] 加载成功，共 ${data.length} 条记录，${Object.keys(grouped).length} 条航线`);
        return priceHistoryCache.data;
    } catch (error) {
        console.error('[PriceHistory] 加载失败:', error.message);
        priceHistoryCache.data = { raw: [], grouped: {} };
        priceHistoryCache.loaded = true;
        return priceHistoryCache.data;
    }
}

/**
 * 生成模拟数据（用于测试）
 */
function generateMockData() {
    const routes = [
        { origin: 'HGH', destination: 'PEK', basePrice: 1800 },
        { origin: 'PEK', destination: 'HGH', basePrice: 1700 },
        { origin: 'PVG', destination: 'PEK', basePrice: 1500 },
        { origin: 'PEK', destination: 'PVG', basePrice: 1400 },
        { origin: 'CAN', destination: 'PEK', basePrice: 2000 },
        { origin: 'PEK', destination: 'CAN', basePrice: 1900 },
        { origin: 'SZX', destination: 'PEK', basePrice: 2100 },
        { origin: 'PEK', destination: 'SZX', basePrice: 2000 },
        { origin: 'HGH', destination: 'NBS', basePrice: 1200 },
        { origin: 'NBS', destination: 'HGH', basePrice: 1100 },
    ];

    const data = [];
    const today = new Date();

    routes.forEach(route => {
        // 生成 60 天的历史数据
        for (let i = 60; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dateStr = date.toISOString().split('T')[0];

            // 价格波动：基础价格 ± 20%
            const fluctuation = 0.8 + Math.random() * 0.4;
            const price = Math.round(route.basePrice * fluctuation);

            data.push({
                flightDate: dateStr,
                origin: route.origin,
                destination: route.destination,
                price,
                collectedDate: dateStr,
            });
        }
    });

    return data;
}

/**
 * 查询价格历史
 * @param {Object} params - 查询参数
 * @param {string} params.origin - 出发地机场代码
 * @param {string} params.destination - 目的地机场代码
 * @param {string} params.date - 查询日期 (YYYY-MM-DD)
 * @returns {Promise<Object>} 价格历史分析结果
 */
async function getPriceHistory(params) {
    const { origin, destination, date } = params;

    const cache = await loadPriceHistory();
    const grouped = cache.grouped || {};

    // 从分组数据中快速获取航线数据
    const routeKey = `${origin}-${destination}`;
    const routeData = grouped[routeKey];

    if (!routeData || Object.keys(routeData).length === 0) {
        return null;
    }

    // 转换为数组
    const records = Object.values(routeData);

    // 计算统计数据
    const prices = records.map(d => d.avgPrice || d.price || 0).filter(p => p > 0);
    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    // 获取指定日期的价格
    let currentPrice = null;
    let currentRecord = null;
    if (date) {
        currentRecord = routeData[date];
        currentPrice = currentRecord?.avgPrice || currentRecord?.price;
    }

    // 如果没有指定日期或使用最近的价格
    if (!currentPrice && records.length > 0) {
        const sortedData = [...records].sort((a, b) =>
            new Date(b.flightDate || b.date) - new Date(a.flightDate || a.date)
        );
        currentRecord = sortedData[0];
        currentPrice = currentRecord?.avgPrice || currentRecord?.price || avgPrice;
    }

    // 计算价格水位
    const priceLevel = currentPrice <= avgPrice * 0.9 ? 'low' :
                       currentPrice >= avgPrice * 1.1 ? 'high' : 'medium';

    // 计算趋势（最近 7 天 vs 前 7 天）
    const sortedByDate = [...records].sort((a, b) =>
        new Date(a.flightDate || a.date) - new Date(b.flightDate || b.date)
    );
    const recent7Days = sortedByDate.slice(0, 7).map(d => d.avgPrice || d.price || 0);
    const previous7Days = sortedByDate.slice(7, 14).map(d => d.avgPrice || d.price || 0);

    const recentAvg = recent7Days.length > 0 ?
        recent7Days.reduce((a, b) => a + b, 0) / recent7Days.length : avgPrice;
    const previousAvg = previous7Days.length > 0 ?
        previous7Days.reduce((a, b) => a + b, 0) / previous7Days.length : avgPrice;

    const trend = recentAvg > previousAvg * 1.05 ? 'up' :
                  recentAvg < previousAvg * 0.95 ? 'down' : 'stable';

    // 生成历史数据点（用于图表）
    const chartData = sortedByDate.map(d => ({
        date: d.flightDate || d.date,
        price: d.avgPrice || d.price || 0,
        sales: d.sales,
        income: d.totalIncome,
    }));

    // 获取航班号信息
    const flightNo = currentRecord?.flightNo || null;

    return {
        currentPrice,
        minPrice,
        maxPrice,
        avgPrice,
        priceLevel,
        priceLevelDesc: getPriceLevelDescription(priceLevel),
        trend,
        trendDescription: getTrendDescription(trend),
        priceHistory: chartData,
        dataSource: '自有数据',
        route: routeKey,
        flightNo,
        sampleSize: records.length,
    };
}

/**
 * 获取价格水位描述
 */
function getPriceLevelDescription(level) {
    switch (level) {
        case 'low': return '低于均价';
        case 'high': return '高于均价';
        case 'stable': return '价格稳定';
        default: return '价格适中';
    }
}

/**
 * 获取趋势描述
 */
function getTrendDescription(trend) {
    switch (trend) {
        case 'up': return '近期上涨';
        case 'down': return '近期下降';
        case 'stable': return '价格稳定';
        default: return '价格波动';
    }
}

/**
 * 批量查询价格历史
 * @param {Array} routes - 航线列表 [{origin, destination, date}]
 * @returns {Promise<Object>} 批量结果
 */
async function getBatchPriceHistory(routes) {
    const results = {};

    for (const route of routes) {
        const key = `${route.origin}-${route.destination}-${route.date}`;
        results[key] = await getPriceHistory(route);
    }

    return results;
}

/**
 * 清除缓存（用于数据更新后）
 */
function clearCache() {
    priceHistoryCache = {
        data: null,
        loaded: false,
        timestamp: 0,
    };
    console.log('[PriceHistory] 缓存已清除');
}

/**
 * 重新加载数据（用于数据更新后）
 */
async function reload() {
    clearCache();
    return await loadPriceHistory();
}

module.exports = {
    loadPriceHistory,
    getPriceHistory,
    getBatchPriceHistory,
    clearCache,
    reload,
};
