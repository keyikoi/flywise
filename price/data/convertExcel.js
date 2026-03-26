/**
 * Excel 数据转换脚本
 *
 * 使用方法：
 * 1. 将 Excel 另存为 CSV 格式 (UTF-8 编码)
 * 2. 将 CSV 文件放入 data/ 目录，命名为 flights_raw.csv
 * 3. 运行：node data/convertExcel.js
 * 4. 生成的 price_history.json 会自动被 priceHistory.js 使用
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'flights_raw.csv');
const JSON_FILE = path.join(__dirname, 'price_history.json');

/**
 * 解析 CSV 文件
 */
function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('CSV 文件不存在:', filePath);
        console.log('请将 Excel 另存为 CSV (UTF-8 编码) 并放入 data/ 目录');
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // 处理 CSV 中的引号和逗号
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
        });
        data.push(row);
    }

    return data;
}

/**
 * 解析 CSV 行（处理引号内的逗号）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

/**
 * 转换数据格式
 * 从航班班次表 -> 价格历史数据
 */
function transformData(rawData) {
    // 按航班日期和航线分组，计算每日平均价格
    const grouped = {};

    rawData.forEach(row => {
        // 提取关键字段
        const flightDate = row['航班日期'] || row['flightDate'];
        const origin = row['出发'] || row['origin'];
        const destination = row['到达'] || row['destination'];

        // 尝试从多个字段获取价格
        const price = parseFloat(
            row['价格'] || row['price'] ||
            row['收入'] || row['income'] ||
            row['舱等数据'] || '0'
        );

        if (!flightDate || !origin || !destination) return;

        const key = `${flightDate}-${origin}-${destination}`;

        if (!grouped[key]) {
            grouped[key] = {
                flightDate,
                origin,
                destination,
                prices: [],
            };
        }

        if (price > 0) {
            grouped[key].prices.push(price);
        }
    });

    // 转换为输出格式
    const result = Object.values(grouped).map(group => {
        const avgPrice = group.prices.length > 0 ?
            Math.round(group.prices.reduce((a, b) => a + b, 0) / group.prices.length) : 0;

        return {
            flightDate: group.flightDate,
            origin: group.origin,
            destination: group.destination,
            price: avgPrice,
            collectedDate: new Date().toISOString().split('T')[0],
            sampleSize: group.prices.length,
        };
    });

    return result;
}

/**
 * 主函数
 */
function main() {
    console.log('=== Excel 数据转换器 ===\n');

    // 解析 CSV
    const rawData = parseCSV(CSV_FILE);
    if (!rawData || rawData.length === 0) {
        console.log('\n未找到数据，将生成模拟数据...');

        // 生成模拟数据
        const mockData = generateMockData();
        fs.writeFileSync(JSON_FILE, JSON.stringify(mockData, null, 2), 'utf-8');
        console.log(`已生成 ${mockData.length} 条模拟数据`);
        return;
    }

    console.log(`读取到 ${rawData.length} 条原始记录`);

    // 转换数据
    const transformedData = transformData(rawData);
    console.log(`转换后 ${transformedData.length} 条价格记录`);

    // 去重和排序
    const uniqueData = Array.from(
        new Map(transformedData.map(item =>
            [`${item.flightDate}-${item.origin}-${item.destination}`, item]
        )).values()
    ).sort((a, b) => {
        if (a.flightDate !== b.flightDate) return a.flightDate.localeCompare(b.flightDate);
        if (a.origin !== b.origin) return a.origin.localeCompare(b.origin);
        return a.destination.localeCompare(b.destination);
    });

    // 保存 JSON
    fs.writeFileSync(JSON_FILE, JSON.stringify(uniqueData, null, 2), 'utf-8');
    console.log(`\n已保存到：${JSON_FILE}`);
    console.log(`共 ${uniqueData.length} 条记录`);

    // 显示统计
    const routes = new Set(uniqueData.map(d => `${d.origin}-${d.destination}`));
    console.log(`覆盖 ${routes.size} 条航线`);
    console.log(`日期范围：${uniqueData[0]?.flightDate} 至 ${uniqueData[uniqueData.length - 1]?.flightDate}`);
}

/**
 * 生成模拟数据
 */
function generateMockData() {
    const routes = [
        { origin: 'HGH', destination: 'PEK', basePrice: 1800 },
        { origin: 'PEK', destination: 'HGH', basePrice: 1700 },
        { origin: 'HGH', destination: 'NBS', basePrice: 1200 },
        { origin: 'NBS', destination: 'HGH', basePrice: 1100 },
        { origin: 'PVG', destination: 'PEK', basePrice: 1500 },
        { origin: 'PEK', destination: 'PVG', basePrice: 1400 },
        { origin: 'CAN', destination: 'PEK', basePrice: 2000 },
        { origin: 'PEK', destination: 'CAN', basePrice: 1900 },
    ];

    const data = [];
    const today = new Date();

    routes.forEach(route => {
        for (let i = 60; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const fluctuation = 0.8 + Math.random() * 0.4;
            const price = Math.round(route.basePrice * fluctuation);

            data.push({
                flightDate: dateStr,
                origin: route.origin,
                destination: route.destination,
                price,
                collectedDate: dateStr,
                sampleSize: Math.floor(Math.random() * 100) + 50,
            });
        }
    });

    return data;
}

main();
