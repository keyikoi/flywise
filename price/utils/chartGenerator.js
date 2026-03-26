/**
 * 价格趋势图表生成器
 * 使用 ChartJS 生成 PNG 图片
 */

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');
const fs = require('fs');

// 图表配置
const WIDTH = 800;
const HEIGHT = 400;
const BACKGROUND_COLOR = '#ffffff';

// 品牌颜色
const COLORS = {
  primary: '#6666FF',      // 主色（品牌蓝）
  primaryLight: 'rgba(102, 102, 255, 0.1)',  // 填充色
  text: '#666666',         // 文字颜色
  grid: '#eeeeee',         // 网格颜色
  current: '#6666FF',      // 当前价格标记
  average: '#999999',      // 均价线
};

/**
 * 生成价格趋势图表
 * @param {Array} priceHistory - 价格历史数据 [{date: '2026-02-08', price: 726}, ...]
 * @param {Object} options - 配置选项
 * @returns {Promise<Buffer>} PNG 图片 Buffer
 */
async function generatePriceChart(priceHistory, options = {}) {
  const {
    title = '近 60 天价格走势',
    currentPrice,
    averagePrice,
    minPrice,
    maxPrice,
  } = options;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: BACKGROUND_COLOR,
  });

  // 格式化日期标签（简化显示）
  const labels = priceHistory.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // 采样数据点（避免过于密集）
  const step = Math.max(1, Math.floor(priceHistory.length / 30));
  const sampledData = priceHistory.filter((_, i) => i % step === 0);
  const sampledLabels = labels.filter((_, i) => i % step === 0);

  const prices = sampledData.map(d => d.price);

  // 计算 Y 轴范围
  const yMin = Math.floor(Math.min(...prices) * 0.9 / 100) * 100;
  const yMax = Math.ceil(Math.max(...prices) * 1.1 / 100) * 100;

  const configuration = {
    type: 'line',
    data: {
      labels: sampledLabels,
      datasets: [
        {
          label: '价格',
          data: prices,
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primaryLight,
          borderWidth: 2,
          fill: true,
          tension: 0.4,  // 曲线平滑度
          pointRadius: 0,  // 默认不显示点
          pointHoverRadius: 6,
          pointBackgroundColor: COLORS.primary,
        },
        // 均价线
        {
          label: '均价',
          data: Array(prices.length).fill(averagePrice),
          borderColor: COLORS.average,
          borderWidth: 1,
          borderDash: [5, 5],  // 虚线
          fill: false,
          pointRadius: 0,
          tension: 0,
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,  // 隐藏图例
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 18,
            weight: 'bold',
            family: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei"',
          },
          color: COLORS.text,
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          enabled: false,  // 静态图片不需要 tooltip
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            font: {
              size: 10,
            },
            color: COLORS.text,
          },
        },
        y: {
          min: yMin,
          max: yMax,
          grid: {
            color: COLORS.grid,
            lineWidth: 1,
          },
          ticks: {
            callback: (value) => `¥${value}`,
            font: {
              size: 10,
            },
            color: COLORS.text,
          },
        },
      },
    },
  };

  // 生成图表
  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  return imageBuffer;
}

/**
 * 生成带统计信息的完整图表
 * @param {Array} priceHistory
 * @param {Object} stats - 统计数据 {currentPrice, averagePrice, minPrice, maxPrice, trend}
 * @returns {Promise<Buffer>}
 */
async function generatePriceChartWithStats(priceHistory, stats) {
  const { currentPrice, averagePrice, minPrice, maxPrice, trend } = stats;

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT + 60,  // 底部增加统计信息区域
    backgroundColour: BACKGROUND_COLOR,
  });

  const labels = priceHistory.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // 采样
  const step = Math.max(1, Math.floor(priceHistory.length / 30));
  const sampledData = priceHistory.filter((_, i) => i % step === 0);
  const sampledLabels = labels.filter((_, i) => i % step === 0);
  const prices = sampledData.map(d => d.price);

  const yMin = Math.floor(Math.min(...prices) * 0.9 / 100) * 100;
  const yMax = Math.ceil(Math.max(...prices) * 1.1 / 100) * 100;

  // 计算当前价格相对于均价的位置
  const priceLevel = currentPrice <= averagePrice * 0.9 ? 'low' :
                     currentPrice >= averagePrice * 1.1 ? 'high' : 'mid';
  const priceLevelColor = priceLevel === 'low' ? '#16A571' :
                          priceLevel === 'high' ? '#E54D4D' : '#666666';
  const priceLevelText = priceLevel === 'low' ? '低于均价' :
                         priceLevel === 'high' ? '高于均价' : '价格适中';

  const configuration = {
    type: 'line',
    data: {
      labels: sampledLabels,
      datasets: [
        {
          label: '价格',
          data: prices,
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primaryLight,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
        {
          label: '均价',
          data: Array(prices.length).fill(averagePrice),
          borderColor: COLORS.average,
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0,
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 40,  // 底部留空放统计信息
        }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: '近 60 天价格走势',
          font: { size: 16, weight: 'bold' },
          color: COLORS.text,
          padding: { top: 10, bottom: 15 },
        },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            font: { size: 10 },
            color: COLORS.text,
          },
        },
        y: {
          min: yMin,
          max: yMax,
          grid: { color: COLORS.grid, lineWidth: 1 },
          ticks: {
            callback: (value) => `¥${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`,
            font: { size: 10 },
            color: COLORS.text,
          },
        },
      },
    },
  };

  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  return imageBuffer;
}

module.exports = {
  generatePriceChart,
  generatePriceChartWithStats,
  COLORS,
  WIDTH,
  HEIGHT,
};
