# 航班预订助手 (AI Chat)

一个 AI Chat 形式的航班预订助手 H5 应用，支持航班推荐、价格分析、购买建议等功能。

## 功能特性

### 核心功能
1. **智能航班推荐** - 根据目的地搜索最佳航班
2. **价格水位显示** - 当前价格与历史价格对比（低/中/高）
3. **价格趋势图表** - 30 天历史价格可视化展示
4. **购买建议** - AI 驱动的建议：现在买 vs 等待观望
5. **降价预测** - 如果建议等待，显示预计降价时间和幅度

## 技术架构

### 技术栈
- **前端**: React 18 + Babel Standalone (单文件 H5)
- **动画**: Framer Motion
- **样式**: 自定义 CSS + 渐变主题
- **字体**: Google Fonts (Manrope + Space Grotesk)
- **数据源**: SerpAPI Google Flights (预留接口)

### 目录结构
```
price/
├── index.html              # 主入口文件（包含所有组件）
├── api/
│   ├── serpapiClient.js    # SerpAPI 客户端实现
│   └── flightApi.js        # 统一数据层接口
├── utils/
│   └── priceAnalyzer.js    # 价格分析工具
└── README.md               # 本文档
```

### 模块说明

#### `api/serpapiClient.js`
- SerpAPI Google Flights 客户端
- 支持航班搜索、数据解析
- 包含模拟数据降级方案

#### `api/flightApi.js`
- 统一的数据层接口
- 封装航班搜索、价格历史、购买建议
- 包含缓存机制
- 预留后端替换接口

#### `utils/priceAnalyzer.js`
- 价格水位计算
- 趋势分析（线性回归）
- SVG 价格图表生成

## 使用方法

### 本地开发
```bash
# 在 price 目录下启动静态服务器
cd price
python3 -m http.server 8080

# 访问
http://localhost:8080/index.html
```

### 快捷操作
应用提供以下快捷操作：
- "查询东京航班" - 搜索前往东京的航班
- "去曼谷多少钱" - 查询曼谷价格分析
- "现在买还是等等" - 获取购买建议
- "价格走势图" - 查看 30 天价格趋势

### 自然语言查询
支持自然语言输入，例如：
- "我想去东京，有什么航班？"
- "曼谷最近价格怎么样？"
- "现在买去首尔的票合适吗？"
- "帮我看看价格趋势"

## 数据流

```
用户输入
    ↓
意图识别 (flight_search / price_inquiry / recommendation / price_trend)
    ↓
API 调用 (flightApi.js)
    ↓
SerpAPI 客户端 (serpapiClient.js)
    ↓
价格分析 (priceAnalyzer.js)
    ↓
UI 渲染 (航班卡片 / 价格图表 / 推荐框)
```

## 后续优化

### 短期
- [ ] 接入真实 SerpAPI（配置 API Key）
- [ ] 完善错误处理和加载状态
- [ ] 添加更多目的地支持

### 中期
- [ ] 自建后端 API 代理（避免前端暴露 API Key）
- [ ] 接入真实历史价格数据
- [ ] 优化价格预测算法

### 长期
- [ ] 用户收藏/关注功能
- [ ] 价格提醒通知
- [ ] 多城市比价

## 注意事项

1. **API Key 配置**: 当前使用模拟数据，实际使用需在 `serpapiClient.js` 中配置 API Key
2. **跨域问题**: 生产环境建议通过后端代理请求
3. **移动端适配**: 已针对手机屏幕优化，最大宽度 480px

## 设计主题

- **主色调**: Electric Purple (#6666FF)
- **强调色**: Mint Green (#4ECDC4), Coral Pink (#FF6B6B)
- **背景**: 深色渐变 + 动态光斑效果
- **风格**: 现代科技感 + 流畅动画
