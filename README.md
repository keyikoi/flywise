# FlyWise - AI 航班助手

[English](README_EN.md) | **简体中文**

一个基于 AI 的智能航班预订助手，包含完整的前后端产品和两个可复用的 AI Skill。

## 📦 项目结构

本仓库包含以下三个主要部分：

### 1. **price/** - 航班助手产品（完整应用）

一个功能完整的 AI Chat 形式航班预订助手 H5 应用。

**核心功能：**
- 🛫 智能航班推荐 - 根据目的地搜索最佳航班
- 💰 价格水位显示 - 当前价格与历史价格对比（低/中/高）
- 📈 价格趋势图表 - 60 天历史价格可视化展示
- 💡 购买建议 - AI 驱动的建议：现在买 vs 等待观望
- 🔍 自然语言查询 - 支持"去东京多少钱"等自然语言输入

**快速开始：**

```bash
cd price

# 1. 配置 API Key（首次使用必需）
cp config.example.json config.json
# 编辑 config.json，填入你的 SerpAPI 和 OpenAI API Key

# 2. 安装依赖
npm install

# 3. 启动服务器
node server.js

# 4. 访问应用
http://localhost:3001
```

**获取 API Key：**
- **SerpAPI**: [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up)（免费）
- **OpenAI/DashScope**: 使用你已有的 API Key

**技术栈：**
- 前端：HTML + JavaScript（单文件 H5）
- 后端：Node.js + Express
- AI：OpenAI / DashScope Qwen
- 数据源：SerpAPI Google Flights

**实现效果示例录屏：**

https://github.com/user-attachments/assets/32d85f93-5cb2-471c-9768-ca030bc567c4


---

### 2. **.agents/skills/price-trend/** - 价格趋势图表 Skill

为 AI Agent 系统提供交互式价格趋势图表组件，适用于需要嵌入可视化图表的场景。

**适用场景：**
- AI Agent 系统中嵌入价格趋势图表
- B 端产品或开发者工具
- 需要交互式数据可视化的场景

**核心特性：**
- 📊 60 天历史价格曲线图
- 🎯 当前价格高亮显示
- 📉 自动计算价格趋势（上升/下降/稳定）
- 🎨 颜色编码（绿色=低价，红色=高价）
- 🖱️ 交互式悬停查看每日价格

**使用方法：**

在 AI Agent 系统中集成此 Skill：

1. **检测航班推荐**：当 AI 输出包含航班搜索结果时触发
2. **获取价格数据**：调用 price trend API 获取 OD 对的历史价格
3. **渲染组件**：在响应末尾嵌入 `PriceChart` 组件

**示例代码：**

```jsx
<PriceChart
  data={priceHistory}           // 60天价格历史 [{date, price}, ...]
  currentPrice={1299}           // 当前航班价格
  analysis={{                   // 价格分析
    min: 1199,
    max: 1899,
    average: 1450,
    pctDiff: -12,
    level: "low",
    trend: "falling"
  }}
  destination={{ code: "TYO", name: "Tokyo" }}
/>
```

**配置要求：**
- 需要配置 SerpAPI Key（见 price/config.json）
- 需要 React 环境支持
- 首次使用前需积累一定历史价格数据

**详细文档：**
- [SKILL.md](.agents/skills/price-trend/SKILL.md) - 完整使用说明
- [references/](.agents/skills/price-trend/references/) - 技术参考文档

---

### 3. **.agents/skills/price-summary/** - 价格总结 Skill

为普通用户生成简洁、易懂的航班价格文字总结，包含购买建议和价格分析。

**适用场景：**
- C 端对话产品（如 Claude、ChatGPT 等）
- 纯文字输出的 AI 助手
- 移动端或无法渲染图表的场景

**核心特性：**
- 💬 纯 Markdown 文字输出，无需图表组件
- ✅ 结论先行：第一句给出明确建议（买/等）
- 📊 数据支撑：用简单数字说明为什么
- 😊 语气友好：像朋友一样给建议

**输出示例：**

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

> 📊 数据基于过去 60 天的价格监测，仅供参考
```

**使用方法：**

在 AI Agent 系统中注册此 Skill，当用户询问价格相关问题时自动触发：

- "这个航班贵吗？"
- "现在买还是再等等？"
- "价格怎么样？"
- "什么时候买最便宜？"

**配置要求：**
- 需要配置 SerpAPI Key（见 price/config.json）
- 无需前端环境，纯文字输出
- 首次使用前需积累一定历史价格数据

**详细文档：**
- [SKILL.md](.agents/skills/price-summary/SKILL.md) - 完整使用说明
- [references/](.agents/skills/price-summary/references/) - 文案模板和分析逻辑

---

## 🔄 三者关系

```
┌─────────────────────────────────────────┐
│         price/ (完整产品)                │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │  前端页面     │  │  后端服务        │  │
│  │  index.html   │  │  server.js       │  │
│  └──────────────┘  └─────────────────┘  │
│                                         │
│  使用 price-trend skill 嵌入图表         │
│  使用 price-summary skill 生成文字总结   │
└─────────────────────────────────────────┘

─────────────────────────────────────────
│  .agents/skills/price-trend/            │
│  - 交互式图表组件                        │
│  - 适用于 B 端/开发者工具                │
│  - 需要 React 环境                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  .agents/skills/price-summary/          │
│  - 纯文字价格总结                        │
│  - 适用于 C 端对话产品                   │
│  - 无需前端环境                          │
└─────────────────────────────────────────┘
```

**选择建议：**
- 如果你需要一个**完整可用的航班助手应用** → 使用 `price/`
- 如果你的 AI Agent 系统需要**嵌入交互式图表** → 使用 `price-trend` skill
- 如果你的 AI Agent 系统只能输出**纯文字** → 使用 `price-summary` skill

---

## ⚙️ 通用配置说明

### API Key 配置（所有模块共用）

1. 复制配置文件模板：
   ```bash
   cp price/config.example.json price/config.json
   ```

2. 编辑 `price/config.json`，填入你的 API Key：
   ```json
   {
     "openai": {
       "apiKey": "你的-OpenAI-API-Key",
       "baseURL": "https://coding.dashscope.aliyuncs.com/v1",
       "model": "qwen3-coder-next"
     },
     "serpapi": {
       "apiKey": "你的-SerpAPI-Key"
     }
   }
   ```

3. 重启服务使配置生效

### 数据积累

首次使用时，系统没有历史价格数据。需要进行几次航班搜索后，系统会自动积累数据：

- **< 7 天数据**：置信度低，标注"数据较少，仅供参考"
- **7-29 天数据**：置信度中等，标注"根据部分真实价格数据..."
- **30+ 天数据**：置信度高，标注"根据积累的真实价格数据..."

---

## 📝 注意事项

1. **API Key 安全**：`config.json` 包含敏感信息，已加入 `.gitignore`，不会上传到 GitHub
2. **数据隐私**：历史价格数据存储在本地 `price/data/` 目录，不会上传
3. **跨域问题**：生产环境建议通过后端代理请求，避免前端暴露 API Key
4. **移动端适配**：price 产品已针对手机屏幕优化

---

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request！

**联系方式：**
- GitHub Issues: [https://github.com/keyikoi/flywise/issues](https://github.com/keyikoi/flywise/issues)
- Email: zhangkeyi.zky@alibaba-inc.com

---

## 📄 License

MIT License
