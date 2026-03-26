# FlyWise + FlyAI 集成文档

## 概述

FlyWise 航班助手现已集成 FlyAI（飞猪）数据源，提供双数据源支持：
- **SerpAPI (Google Flights)**: 国际航班数据更全面
- **FlyAI (飞猪)**: 国内/亚洲航班、酒店、景点资源更丰富

## 新增 API 端点

### 1. 航班搜索（双数据源）

```bash
POST http://localhost:3001/api/flyai/search
```

**请求参数**:
```json
{
  "origin": "上海",           // 出发地（城市名或机场代码）
  "destination": "东京",       // 目的地
  "departDate": "2026-04-15", // 出发日期
  "returnDate": "2026-04-20", // 返程日期（可选）
  "dataSource": "auto"        // 数据源：'auto' | 'serpapi' | 'flyai' | 'both'
}
```

**响应示例**:
```json
{
  "success": true,
  "source": "flyai",
  "flights": [
    {
      "id": "flyai-0-xxx",
      "source": "flyai",
      "airline": "吉祥航空",
      "flight_number": "HO1379",
      "origin": "PVG",
      "destination": "NRT",
      "depart_time": "08:15",
      "arrive_time": "12:05",
      "price": 1142,
      "currency": "CNY",
      "stops": 0,
      "jumpUrl": "https://a.feizhu.com/xxx"
    }
  ],
  "total": 10
}
```

### 2. 快速搜索（全品类旅游产品）

```bash
POST http://localhost:3001/api/flyai/fast-search
```

**请求参数**:
```json
{
  "query": "上海到东京航班"
}
```

### 3. 酒店搜索

```bash
POST http://localhost:3001/api/flyai/hotels
```

**请求参数**:
```json
{
  "destName": "杭州",
  "poiName": "西湖",
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-12"
}
```

### 4. 景点搜索

```bash
POST http://localhost:3001/api/flyai/poi
```

**请求参数**:
```json
{
  "cityName": "北京",
  "category": "历史古迹"
}
```

## 数据源策略

### 自动选择逻辑 (`dataSource: "auto"`)

| 航线类型 | 使用数据源 |
|---------|----------|
| 国内航班 | FlyAI（飞猪资源更丰富） |
| 亚洲短途 | FlyAI（价格更有优势） |
| 国际长途 | SerpAPI（Google Flights 覆盖更广） |

### 手动指定数据源

```javascript
// 强制使用 FlyAI
{ "dataSource": "flyai" }

// 强制使用 SerpAPI
{ "dataSource": "serpapi" }

// 同时查询两个数据源并合并
{ "dataSource": "both" }
```

## 文件结构

```
price/
├── api/
│   ├── serpapiClient.js    # SerpAPI 客户端（已更新）
│   ├── flyaiClient.js      # FlyAI CLI 客户端（新增）
│   └── flightService.js    # 统一航班服务层（新增）
├── server.js               # 后端服务器（已更新）
└── config.json             # 配置文件（已更新）
```

## 使用示例

### 前端调用示例

```javascript
// 搜索航班
async function searchFlights(origin, destination, date) {
  const response = await fetch('http://localhost:3001/api/flyai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      departDate: date,
      dataSource: 'auto' // 自动选择最优数据源
    })
  });

  const result = await response.json();
  return result.flights;
}

// 使用示例
const flights = await searchFlights('上海', '东京', '2026-04-15');
console.log(`找到 ${flights.length} 个航班`);
```

### 同时使用两个数据源对比

```javascript
const response = await fetch('http://localhost:3001/api/flyai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: '上海',
    destination: '东京',
    departDate: '2026-04-15',
    dataSource: 'both' // 同时查询两个数据源
  })
});

const result = await response.json();
console.log(`FlyAI: ${result.breakdown.flyai} 个航班`);
console.log(`SerpAPI: ${result.breakdown.serpapi} 个航班`);
```

## 配置说明

### config.json

```json
{
  "openai": {
    "apiKey": "sk-xxx",
    "baseURL": "https://xxx",
    "model": "qwen3-coder-next"
  },
  "serpapi": {
    "apiKey": "xxx"
  },
  "flyai": {
    "apiKey": ""  // 可选，不配置也可正常使用
  }
}
```

### FlyAI API Key（可选）

FlyAI 默认不需要 API Key 即可使用。如需更高调用限额，可访问 [https://open.fly.ai/](https://open.fly.ai/) 申请。

```bash
flyai config set FLYAI_API_KEY "your-key"
```

## 启动服务器

```bash
cd price
npm install  # 确保依赖已安装
npm start    # 或 node server.js
```

服务器启动后访问：http://localhost:3001

## API 测试

```bash
# 测试航班搜索
curl -X POST http://localhost:3001/api/flyai/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"上海","destination":"东京","departDate":"2026-04-15"}'

# 测试快速搜索
curl -X POST http://localhost:3001/api/flyai/fast-search \
  -H "Content-Type: application/json" \
  -d '{"query":"杭州三日游"}'

# 测试酒店搜索
curl -X POST http://localhost:3001/api/flyai/hotels \
  -H "Content-Type: application/json" \
  -d '{"destName":"杭州","poiName":"西湖"}'
```

## 数据源对比

| 特性 | SerpAPI (Google Flights) | FlyAI (飞猪) |
|------|-------------------------|-------------|
| 覆盖范围 | 全球航班 | 国内/亚洲为主 |
| 价格优势 | 国际航班 | 国内/亚洲航班 |
| 打包产品 | 较少 | 丰富（机酒套餐等） |
| 预订链接 | 多平台 | 飞猪平台 |
| 中文支持 | 好 | 更好 |
| API Key | 必需 | 可选 |

## 下一步

1. **前端集成**: 在前端添加数据源切换选项
2. **价格对比**: 同时展示两个数据源的价格
3. **智能推荐**: 基于价格和覆盖率自动推荐最优数据源
4. **缓存优化**: 为两个数据源实现统一的缓存策略
