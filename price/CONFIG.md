# FlyWise 配置说明

## 1. SerpApi 配置

### 获取 API Key
1. 访问 https://serpapi.com/
2. 注册账号
3. 在 Dashboard 获取 API Key

### 配置方式

由于 SerpApi 不允许直接从浏览器调用（会暴露 API Key），你需要以下两种方式之一：

---

## 方案 A：使用后端代理（推荐）

### 创建简单的 Node.js 后端

```javascript
// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const SERPAPI_KEY = '你的 API_KEY';

app.get('/api/flights', async (req, res) => {
  const { departure, arrival, date } = req.query;

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.append('engine', 'google_flights');
  url.searchParams.append('api_key', SERPAPI_KEY);
  url.searchParams.append('departure_id', departure);
  url.searchParams.append('arrival_id', arrival);
  url.searchParams.append('outbound_date', date);

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.listen(3001);
```

### 修改前端 API 调用
在 `api/serpapiClient.js` 中修改：

```javascript
const SERPAPI_CONFIG = {
    baseUrl: 'http://localhost:3001/api/flights', // 你的后端地址
    apiKey: '', // 后端已配置，前端不需要
};
```

---

## 方案 B：使用 Vercel Serverless Function

### 1. 创建 `api/flights.js`

```javascript
// vercel-flights.js
export default async function handler(req, res) {
  const { departure, arrival, date } = req.query;

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.append('engine', 'google_flights');
  url.searchParams.append('api_key', process.env.SERPAPI_KEY);
  url.searchParams.append('departure_id', departure);
  url.searchParams.append('arrival_id', arrival);
  url.searchParams.append('outbound_date', date);

  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
}
```

### 2. 在 Vercel 配置环境变量
```
SERPAPI_KEY=你的 API_KEY
```

---

## 快速测试（开发环境）

如果你只想快速测试，可以在 `api/serpapiClient.js` 中直接配置：

```javascript
const SERPAPI_CONFIG = {
    baseUrl: 'https://serpapi.com/search.json',
    engine: 'google_flights',
    apiKey: '你的 API_KEY', // ⚠️ 仅限本地测试，不要部署到生产环境
};
```

**警告**：这种方式会将 API Key 暴露在前端代码中，只能用于本地开发测试！

---

## 2. AI 模型接入（可选）

### Claude API 配置

在 `api/aiAssistant.js` 中配置：

```javascript
const CLAUDE_CONFIG = {
    apiKey: '你的 Claude API Key',
    model: 'claude-sonnet-4-20250514',
};

async function askAI(question, context) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_CONFIG.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: CLAUDE_CONFIG.model,
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `你是 FlyWise 航班助手。${question}\n\n航班数据：${JSON.stringify(context)}`
            }]
        })
    });
    const data = await response.json();
    return data.content[0].text;
}
```

---

## 3. 文件结构

```
price/
├── index.html          # 主页面（FlyWise 前端）
├── api/
│   ├── serpapiClient.js    # SerpApi 客户端
│   └── flightApi.js        # 航班 API 统一接口
├── utils/
│   └── priceAnalyzer.js    # 价格分析工具
├── icon/               # 航司 Logo 文件夹
│   ├── 春秋航空.png
│   ├── 东方航空.png
│   └── 全日空.png
└── CONFIG.md           # 配置说明（本文件）
```

---

## 4. 下一步

1. **获取 SerpApi Key** → 修改 `api/serpapiClient.js` 第 13 行
2. **测试本地运行** → 直接打开 `index.html`
3. **部署后端** → 选择 Node.js 或 Vercel Serverless
4. **接入 AI** → 创建 `api/aiAssistant.js`

---

## 常见问题

**Q: SerpApi 免费额度是多少？**
A: 免费版每月 100 次搜索，适合个人使用和测试。

**Q: 国内能直接用 SerpApi 吗？**
A: 可能需要代理，建议部署在海外服务器。

**Q: 如何扩展更多航司 Logo？**
A: 将 Logo 放入 `icon/` 文件夹，在 `FlightCards` 组件的 `airlineLogos` 对象中添加映射。
