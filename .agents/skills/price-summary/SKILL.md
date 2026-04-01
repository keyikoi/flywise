---
name: price-summary
description: Generate concise, user-friendly price summaries for flight searches. Use this skill whenever users ask about flight prices, whether to buy now or wait, price trends, or price analysis - even if they don't explicitly mention "summary". This skill is designed for end-user products like Claude-like chat interfaces.
metadata:
  version: 1.0.0
  agent:
    type: text-response
    runtime: markdown
    context_isolation: none
  openclaw:
    emoji: "💰"
    priority: 90
    requires:
      bins: []
    intents:
      - price_summary
      - buy_recommendation
      - price_analysis
      - flight_cost_advice
    patterns:
      - "(这个价格.*贵 | 便宜 | 值 | 划算)"
      - "(现在.*买 | 要不要.*买 | 等.*等)"
      - "(价格.*怎么样 | 价格.*分析 | 价格.*趋势)"
      - "(贵吗 | 便宜吗 | 划算吗 | 值得.*吗)"
      - "(多少钱 | 什么价格 | 价格多少)"
---

# Price Summary Module

为普通用户生成简洁、易懂的航班价格总结，包含购买建议和价格分析。

## 核心原则

1. **文字为主**：不使用任何图表组件，纯 Markdown 输出
2. **结论先行**：第一句给出明确建议（买/等）
3. **数据支撑**：用简单数字说明为什么
4. **语气友好**：像朋友一样给建议，不是冷冰冰的数据

## 输出结构

```markdown
## 💰 价格分析

### 当前价格：¥1,299

**价格水位**：🟢 低于均价 12%

| 对比项 | 价格 |
|--------|------|
| 60 天最低 | ¥1,199 |
| 60 天平均 | ¥1,450 |
| 60 天最高 | ¥1,899 |

**走势**：📉 近 7 天下降趋势

---

### 💡 建议：现在购买 ✅

当前价格比 60 天平均水平便宜 ¥151，处于较低水位。
如果您行程已确定，建议尽快下单。

> 数据基于过去 60 天的价格监测
```

## 触发场景

### 1. 用户直接问价格
- "这个航班贵吗？"
- "现在买划算吗？"
- "价格怎么样？"

### 2. 用户问购买时机
- "现在买还是再等等？"
- "什么时候买最便宜？"
- "要不要等降价？"

### 3. 航班搜索后自动展示
当用户搜索航班后，主动提供价格分析。

## 文案模板

### 低价场景（低于均价 15%+）
```
### 💡 建议：现在购买 ✅

当前价格比 60 天平均水平便宜 ¥XXX，处于**历史低位**。
这是近 2 个月来最便宜的价格之一，如果您行程确定，建议尽快下单。

📈 类似低价上次出现在 X 月 X 日
```

### 中价场景（均价±15%）
```
### 💡 建议：可以购买，也可观望 🟡

当前价格接近 60 天平均水平，不算贵但也不是最低。
如果您不着急，可以关注 1-2 周，可能会有小幅下降。

⚠️ 但需注意：临近出发日期价格通常会上涨
```

### 高价场景（高于均价 15%+）
```
### 💡 建议：再等等 🔴

当前价格比 60 天平均水平贵 ¥XXX，处于**历史高位**。
建议继续观望，预计 X 周后价格可能回落。

📊 近 30 天最高价出现在 X 月 X 日，当前价格接近该水平
```

## 数据格式

### 输入
```javascript
{
  currentPrice: 1299,
  priceHistory: [
    { date: "2026-01-01", price: 1450 },
    // ... 60 天数据
  ],
  origin: "上海",
  destination: "东京",
  departureDate: "2026-04-15"
}
```

### 计算逻辑
```javascript
// 1. 计算统计值
const min = Math.min(...prices);
const max = Math.max(...prices);
const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
const pctDiff = ((currentPrice - avg) / avg * 100).toFixed(0);

// 2. 判断水位
let level = pctDiff < -15 ? 'low' : pctDiff > 15 ? 'high' : 'mid';

// 3. 判断趋势（7 日移动平均对比）
const recent7Avg = average(prices.slice(-7));
const previous7Avg = average(prices.slice(-14, -7));
const trend = recent7Avg < previous7Avg ? 'falling' : recent7Avg > previous7Avg ? 'rising' : 'stable';
```

## Emoji 使用规范

| 场景 | Emoji | 含义 |
|------|-------|------|
| 价格分析标题 | 💰 | 金钱/价格 |
| 建议标题 | 💡 | 建议/提示 |
| 低价/推荐 | 🟢 ✅ | 通过/推荐 |
| 中价/观望 | 🟡 ⏳ | 等待/中性 |
| 高价/不推荐 | 🔴 ⚠️ | 警告/不推荐 |
| 下降趋势 | 📉 | 价格下降 |
| 上升趋势 | 📈 | 价格上涨 |
| 稳定趋势 | ➡️ | 价格平稳 |

## 注意事项

1. **不要过度承诺**：用"建议"而非"一定"
2. **标注数据来源**：说明是基于历史数据
3. **考虑时效性**：临近出发日期的建议应更积极
4. **避免专业术语**：不说"百分位"，说"比平时便宜 X%"

## 与 price-trend 的区别

| 维度 | price-summary | price-trend |
|------|---------------|-------------|
| 目标用户 | 普通 C 端用户 | 开发者/B 端 |
| 输出形式 | 纯 Markdown 文字 | React 组件/图表 |
| 使用场景 | 对话产品直接输出 | Agent 系统嵌入组件 |
| 复杂度 | 低 | 高 |
| 依赖 | 无 | 需要前端环境 |

## 示例输出

### 完整示例
```markdown
## 💰 上海 → 东京 价格分析

### 当前价格：¥1,299

**价格水位**：🟢 比均价便宜 12%

| 对比项 | 价格 | 说明 |
|--------|------|------|
| 60 天最低 | ¥1,199 | 出现在 2/15 |
| 60 天平均 | ¥1,450 | — |
| 60 天最高 | ¥1,899 | 出现在春节期间 |

**近期走势**：📉 连续 7 天下降

---

### 💡 建议：现在购买 ✅

当前价格处于近 2 个月的较低水平，比平时便宜约 ¥151。

如果您行程已确定（4 月 15 日出行的话），现在是比较好的入手时机。
通常来说，国际航班提前 1-2 个月预订价格最优。

> 📊 数据基于过去 60 天的价格监测，仅供参考
```

### 简短示例（移动端）
```
💰 **当前价格：¥1,299**

🟢 比均价便宜 12% | 📉 近 7 天下降

💡 **建议现在购买** — 价格处于低位，行程确定可入手
```
