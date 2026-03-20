/**
 * 价格分析工具模块
 *
 * 提供价格水位计算、历史价格分析、简单图表绘制等功能
 */

/**
 * 价格水位枚举（避免重复声明）
 */
if (!window.PriceLevel) {
    window.PriceLevel = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
    };
}
const PriceLevel = window.PriceLevel;

/**
 * 价格分析器类
 */
class PriceAnalyzer {
    /**
     * 分析价格数据
     * @param {number} currentPrice - 当前价格
     * @param {Array<number>} historicalPrices - 历史价格数组
     * @returns {Object} 分析结果
     */
    analyze(currentPrice, historicalPrices) {
        if (!historicalPrices || historicalPrices.length === 0) {
            return this.createEmptyAnalysis(currentPrice);
        }

        const stats = this.calculateStats(historicalPrices);
        const level = this.determinePriceLevel(currentPrice, stats);
        const trend = this.analyzeTrend(historicalPrices);

        return {
            currentPrice,
            ...stats,
            level,
            trend,
            recommendation: this.generateRecommendation(currentPrice, stats, trend),
        };
    }

    /**
     * 计算统计数据
     * @param {Array<number>} prices
     * @returns {Object}
     */
    calculateStats(prices) {
        const sorted = [...prices].sort((a, b) => a - b);
        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = sum / prices.length;

        // 计算中位数
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];

        // 计算百分位数（25th, 75th）
        const p25 = sorted[Math.floor(sorted.length * 0.25)];
        const p75 = sorted[Math.floor(sorted.length * 0.75)];

        // 计算标准差
        const squaredDiffs = prices.map(p => Math.pow(p - avg, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(variance);

        return {
            average: Math.round(avg),
            median: Math.round(median),
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p25: Math.round(p25),
            p75: Math.round(p75),
            stdDev: Math.round(stdDev),
            count: prices.length,
        };
    }

    /**
     * 确定价格水位
     * @param {number} currentPrice
     * @param {Object} stats
     * @returns {Object}
     */
    determinePriceLevel(currentPrice, stats) {
        const { average, p25, p75, min, max } = stats;

        // 计算相对于历史均价的百分比
        const percentFromAverage = ((currentPrice - average) / average) * 100;

        // 计算在历史价格中的百分位
        const percentile = this.calculatePercentile(currentPrice, stats);

        let level;
        let score; // 0-100，越低越便宜

        if (currentPrice <= p25) {
            level = PriceLevel.LOW;
            score = Math.max(0, percentile * 100);
        } else if (currentPrice >= p75) {
            level = PriceLevel.HIGH;
            score = Math.min(100, percentile * 100);
        } else {
            level = PriceLevel.MEDIUM;
            score = percentile * 100;
        }

        return {
            level,
            score: Math.round(score),
            percentile: Math.round(percentile * 100),
            percentFromAverage: Math.round(percentFromAverage),
            description: this.getLevelDescription(level, percentFromAverage),
        };
    }

    /**
     * 计算百分位
     * @param {number} value
     * @param {Object} stats
     * @returns {number}
     */
    calculatePercentile(value, stats) {
        const { min, max } = stats;
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }

    /**
     * 获取水位描述文案
     * @param {string} level
     * @param {number} percentFromAverage
     * @returns {string}
     */
    getLevelDescription(level, percentFromAverage) {
        if (level === PriceLevel.LOW) {
            const below = Math.abs(percentFromAverage);
            return `比历史均价低 ${below}%，是入手的好时机`;
        } else if (level === PriceLevel.HIGH) {
            const above = percentFromAverage;
            return `比历史均价高 ${above}%，建议等待降价`;
        }
        return '价格处于历史平均水平，可根据需求决定';
    }

    /**
     * 分析价格趋势
     * @param {Array<number>} prices
     * @returns {Object}
     */
    analyzeTrend(prices) {
        if (prices.length < 3) {
            return {
                direction: 'stable',
                strength: 0,
                description: '数据不足，无法判断趋势',
            };
        }

        // 使用简单线性回归分析趋势
        const n = prices.length;
        const xMean = (n - 1) / 2;
        const yMean = prices.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (i - xMean) * (prices[i] - yMean);
            denominator += Math.pow(i - xMean, 2);
        }

        const slope = numerator / denominator;

        // 计算趋势强度（相对于平均价格的变化率）
        const trendStrength = (slope / yMean) * 100;

        let direction;
        let description;

        if (trendStrength > 2) {
            direction = 'rising';
            description = '价格呈上涨趋势';
        } else if (trendStrength < -2) {
            direction = 'falling';
            description = '价格呈下降趋势';
        } else {
            direction = 'stable';
            description = '价格相对稳定';
        }

        // 预测未来 7 天价格
        const predictedChange = slope * 7;
        const predictedPrice = prices[n - 1] + predictedChange;

        return {
            direction,
            strength: Math.round(Math.abs(trendStrength) * 10) / 10,
            slope: Math.round(slope * 100) / 100,
            description,
            predictedPrice: Math.round(predictedPrice),
            predictedChange: Math.round(predictedChange),
        };
    }

    /**
     * 生成购买建议
     * @param {number} currentPrice
     * @param {Object} stats
     * @param {Object} trend
     * @returns {Object}
     */
    generateRecommendation(currentPrice, stats, trend) {
        const level = this.determinePriceLevel(currentPrice, stats);

        // 综合评分（0-100，越高越建议购买）
        let buyScore = 100 - level.score;

        // 根据趋势调整
        if (trend.direction === 'rising') {
            buyScore += 15; // 上涨趋势，建议早点买
        } else if (trend.direction === 'falling') {
            buyScore -= 20; // 下降趋势，建议等待
        }

        buyScore = Math.max(0, Math.min(100, buyScore));

        // 生成建议
        let action;
        let confidence;
        let reason;
        let waitTime = null;

        if (buyScore >= 70) {
            action = 'buy';
            confidence = Math.min(95, buyScore + 10);
            reason = level.level === PriceLevel.LOW
                ? `当前价格处于历史低位，${level.description}`
                : `价格 ${trend.direction === 'rising' ? '正在上涨' : '合理'}，建议尽早入手`;
        } else if (buyScore <= 40) {
            action = 'wait';
            confidence = Math.min(90, 100 - buyScore);
            reason = trend.direction === 'falling'
                ? `价格正在下降，${trend.description}，预计还能降 ¥${Math.abs(trend.predictedChange)}`
                : `当前价格偏高，${level.description}`;
            waitTime = this.estimateWaitTime(trend);
        } else {
            action = 'buy';
            confidence = 60 + Math.round((buyScore - 40) * 0.5);
            reason = '价格处于合理区间，如有明确出行计划可入手';
        }

        return {
            action,
            confidence,
            reason,
            waitTime,
            buyScore,
        };
    }

    /**
     * 估算等待时间
     * @param {Object} trend
     * @returns {string}
     */
    estimateWaitTime(trend) {
        if (trend.direction === 'falling') {
            const daysToTarget = Math.abs(trend.predictedPrice - trend.slope * 14);
            if (Math.abs(trend.slope) > 50) {
                return '3-5 天';
            } else if (Math.abs(trend.slope) > 20) {
                return '1-2 周';
            }
            return '2-3 周';
        }
        return '视具体情况而定';
    }

    /**
     * 创建空分析结果
     * @param {number} currentPrice
     * @returns {Object}
     */
    createEmptyAnalysis(currentPrice) {
        return {
            currentPrice,
            average: currentPrice,
            median: currentPrice,
            min: currentPrice,
            max: currentPrice,
            p25: currentPrice,
            p75: currentPrice,
            stdDev: 0,
            count: 0,
            level: {
                level: PriceLevel.MEDIUM,
                score: 50,
                percentile: 50,
                percentFromAverage: 0,
                description: '暂无历史数据对比',
            },
            trend: {
                direction: 'stable',
                strength: 0,
                description: '数据不足，无法判断趋势',
                predictedPrice: currentPrice,
                predictedChange: 0,
            },
            recommendation: {
                action: 'wait',
                confidence: 50,
                reason: '暂无足够历史数据进行价格分析',
                waitTime: null,
                buyScore: 50,
            },
        };
    }
}

/**
 * 简单的 SVG 价格图表生成器
 */
class PriceChartGenerator {
    /**
     * 生成价格历史图表的 SVG
     * @param {Array<{date: string, price: number}>} data
     * @param {Object} options
     * @returns {string} SVG 字符串
     */
    generateSvg(data, options = {}) {
        const {
            width = 320,
            height = 120,
            padding = 20,
            lineColor = '#6666FF',
            fillColor = 'rgba(102, 102, 255, 0.1)',
            showGrid = true,
            showLabels = true,
        } = options;

        if (!data || data.length === 0) {
            return this.generateEmptySvg(width, height);
        }

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const prices = data.map(d => d.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // 生成坐标点
        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
            return { x, y, ...d };
        });

        // 生成路径
        const linePath = this.generateLinePath(points);
        const areaPath = this.generateAreaPath(points, padding + chartHeight);

        // 生成网格线
        const gridLines = showGrid ? this.generateGridLines(padding, chartWidth, chartHeight, 4) : '';

        // 生成价格标签
        const labels = showLabels ? this.generateLabels(points, minPrice, maxPrice) : '';

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${lineColor};stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:${lineColor};stop-opacity:0" />
                    </linearGradient>
                </defs>
                ${gridLines}
                <path d="${areaPath}" fill="url(#priceGradient)" />
                <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                ${labels}
            </svg>
        `.trim();
    }

    /**
     * 生成折线路径
     * @param {Array<{x: number, y: number}>} points
     * @returns {string}
     */
    generateLinePath(points) {
        if (points.length === 0) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            // 使用平滑曲线
            const prev = points[i - 1];
            const curr = points[i];
            const cp1x = prev.x + (curr.x - prev.x) / 3;
            const cp1y = prev.y;
            const cp2x = prev.x + (curr.x - prev.x) * 2 / 3;
            const cp2y = curr.y;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        }

        return path;
    }

    /**
     * 生成面积图路径
     * @param {Array<{x: number, y: number}>} points
     * @param {number} baselineY
     * @returns {string}
     */
    generateAreaPath(points, baselineY) {
        if (points.length === 0) return '';

        const linePath = this.generateLinePath(points);
        const closePath = `L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

        return linePath + ' ' + closePath;
    }

    /**
     * 生成网格线
     * @param {number} padding
     * @param {number} width
     * @param {number} height
     * @param {number} count
     * @returns {string}
     */
    generateGridLines(padding, width, height, count) {
        let lines = '';
        const step = height / count;

        for (let i = 0; i <= count; i++) {
            const y = padding + i * step;
            lines += `<line x1="${padding}" y1="${y}" x2="${padding + width}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`;
        }

        return lines;
    }

    /**
     * 生成标签
     * @param {Array<{x: number, y: number, price: number}>} points
     * @param {number} minPrice
     * @param {number} maxPrice
     * @returns {string}
     */
    generateLabels(points, minPrice, maxPrice) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        return `
            <text x="${firstPoint.x - 5}" y="${firstPoint.y - 5}" text-anchor="end" fill="rgba(255,255,255,0.6)" font-size="10">¥${minPrice}</text>
            <text x="${lastPoint.x + 5}" y="${lastPoint.y - 5}" text-anchor="start" fill="rgba(255,255,255,0.6)" font-size="10">¥${maxPrice}</text>
        `.trim();
    }

    /**
     * 生成空状态 SVG
     * @param {number} width
     * @param {number} height
     * @returns {string}
     */
    generateEmptySvg(width, height) {
        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${width}" height="${height}" fill="rgba(255,255,255,0.02)" />
                <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="12">暂无数据</text>
            </svg>
        `.trim();
    }
}

// 导出单例（避免重复声明）
if (!window.priceAnalyzer) {
    window.priceAnalyzer = new PriceAnalyzer();
}
if (!window.chartGenerator) {
    window.chartGenerator = new PriceChartGenerator();
}
if (!window.PriceAnalyzer) {
    window.PriceAnalyzer = PriceAnalyzer;
}

// 支持模块化和全局使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PriceAnalyzer, PriceLevel: window.PriceLevel, priceAnalyzer: window.priceAnalyzer, chartGenerator: window.chartGenerator };
}
