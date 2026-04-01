# FlyWise - AI Flight Assistant

[简体中文](README.md) | **English**

An AI-powered intelligent flight booking assistant, including a complete frontend/backend product and two reusable AI Skills.

## 📦 Project Structure

This repository contains three main parts:

### 1. **price/** - Flight Assistant Product (Complete Application)

A fully functional AI Chat-style flight booking H5 application.

**Core Features:**
- 🛫 Smart Flight Recommendations - Search for best flights by destination
- 💰 Price Level Display - Compare current price with historical prices (low/medium/high)
- 📈 Price Trend Charts - 60-day historical price visualization
- 💡 Purchase Recommendations - AI-driven advice: Buy Now vs Wait
- 🔍 Natural Language Queries - Support queries like "How much to Tokyo?"

**Quick Start:**

```bash
cd price

# 1. Configure API Keys (Required for first use)
cp config.example.json config.json
# Edit config.json and fill in your SerpAPI and OpenAI API Keys

# 2. Install dependencies
npm install

# 3. Start server
node server.js

# 4. Access application
http://localhost:3001
```

**Get API Keys:**
- **SerpAPI**: [https://serpapi.com/users/sign_up](https://serpapi.com/users/sign_up) (Free)
- **OpenAI/DashScope**: Use your existing API Key

**Tech Stack:**
- Frontend: HTML + JavaScript (Single-file H5)
- Backend: Node.js + Express
- AI: OpenAI / DashScope Qwen
- Data Source: SerpAPI Google Flights

---

### 2. **.agents/skills/price-trend/** - Price Trend Chart Skill

Provides interactive price trend chart components for AI Agent systems, suitable for scenarios requiring embedded visualizations.

**Use Cases:**
- Embedding price trend charts in AI Agent systems
- B-end products or developer tools
- Scenarios requiring interactive data visualization

**Core Features:**
- 📊 60-day historical price curve
- 🎯 Current price highlighting
- 📉 Automatic trend calculation (rising/falling/stable)
- 🎨 Color coding (green=low, red=high)
- 🖱️ Interactive hover to view daily prices

**Usage:**

Integrate this Skill in your AI Agent system:

1. **Detect flight recommendations**: Trigger when AI output contains flight search results
2. **Fetch price data**: Call price trend API to get historical prices for OD pair
3. **Render component**: Embed `PriceChart` component at the end of response

**Example Code:**

```jsx
<PriceChart
  data={priceHistory}           // 60-day price history [{date, price}, ...]
  currentPrice={1299}           // Current flight price
  analysis={{                   // Price analysis
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

**Requirements:**
- SerpAPI Key configuration required (see price/config.json)
- React environment support needed
- Historical price data accumulation required before first use

**Documentation:**
- [SKILL.md](.agents/skills/price-trend/SKILL.md) - Complete usage guide
- [references/](.agents/skills/price-trend/references/) - Technical reference docs

---

### 3. **.agents/skills/price-summary/** - Price Summary Skill

Generates concise, user-friendly text summaries of flight prices with purchase recommendations and price analysis for ordinary users.

**Use Cases:**
- C-end chat products (e.g., Claude, ChatGPT)
- AI assistants with text-only output
- Mobile or scenarios where charts cannot be rendered

**Core Features:**
- 💬 Pure Markdown text output, no chart components needed
- ✅ Conclusion first: Clear recommendation in the first sentence (buy/wait)
- 📊 Data-backed: Simple numbers explain why
- 😊 Friendly tone: Advice like a friend

**Output Example:**

```markdown
## 💰 Shanghai → Tokyo Price Analysis

### Current Price: ¥1,299

**Price Level**: 🟢 12% below average

| Comparison | Price | Note |
|------------|-------|------|
| 60-day Low | ¥1,199 | Appeared on Feb 15 |
| 60-day Avg | ¥1,450 | — |
| 60-day High | ¥1,899 | During Spring Festival |

**Recent Trend**: 📉 Falling for 7 consecutive days

---

### 💡 Recommendation: Buy Now ✅

Current price is at a relatively low level in the past 2 months, about ¥151 cheaper than usual.
If your travel plans are confirmed (departing on April 15), now is a good time to book.

> 📊 Data based on 60-day price monitoring, for reference only
```

**Usage:**

Register this Skill in your AI Agent system. It automatically triggers when users ask price-related questions:

- "Is this flight expensive?"
- "Should I buy now or wait?"
- "How's the price?"
- "When is the cheapest time to buy?"

**Requirements:**
- SerpAPI Key configuration required (see price/config.json)
- No frontend environment needed, pure text output
- Historical price data accumulation required before first use

**Documentation:**
- [SKILL.md](.agents/skills/price-summary/SKILL.md) - Complete usage guide
- [references/](.agents/skills/price-summary/references/) - Copywriting templates and analysis logic

---

## 🔄 Relationship Between the Three

```
┌─────────────────────────────────────────┐
│         price/ (Complete Product)        │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │  Frontend    │  │  Backend        │  │
│  │  index.html  │  │  server.js      │  │
│  └──────────────┘  └─────────────────┘  │
│                                         │
│  Uses price-trend skill for charts      │
│  Uses price-summary skill for text      │
└─────────────────────────────────────────┘

─────────────────────────────────────────
│  .agents/skills/price-trend/            │
│  - Interactive chart components         │
│  - For B-end/developer tools            │
│  - Requires React environment           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  .agents/skills/price-summary/          │
│  - Pure text price summaries            │
│  - For C-end chat products              │
│  - No frontend environment needed       │
└─────────────────────────────────────────┘
```

**Selection Guide:**
- If you need a **complete, ready-to-use flight assistant app** → Use `price/`
- If your AI Agent system needs **embedded interactive charts** → Use `price-trend` skill
- If your AI Agent system can only output **plain text** → Use `price-summary` skill

---

## ⚙️ Common Configuration

### API Key Configuration (Shared by all modules)

1. Copy the configuration template:
   ```bash
   cp price/config.example.json price/config.json
   ```

2. Edit `price/config.json` and fill in your API Keys:
   ```json
   {
     "openai": {
       "apiKey": "your-openai-api-key",
       "baseURL": "https://coding.dashscope.aliyuncs.com/v1",
       "model": "qwen3-coder-next"
     },
     "serpapi": {
       "apiKey": "your-serpapi-key"
     }
   }
   ```

3. Restart the service to apply changes

### Data Accumulation

On first use, the system has no historical price data. After several flight searches, the system will automatically accumulate data:

- **< 7 days of data**: Low confidence, labeled "Limited data, for reference only"
- **7-29 days of data**: Medium confidence, labeled "Based on partial real price data..."
- **30+ days of data**: High confidence, labeled "Based on accumulated real price data..."

---

## 📝 Notes

1. **API Key Security**: `config.json` contains sensitive information and is added to `.gitignore`, so it won't be uploaded to GitHub
2. **Data Privacy**: Historical price data is stored locally in `price/data/` directory and won't be uploaded
3. **CORS Issues**: In production, it's recommended to proxy requests through the backend to avoid exposing API keys on the frontend
4. **Mobile Optimization**: The price product is optimized for mobile screens

---

## 🤝 Contributions & Feedback

Issues and Pull Requests are welcome!

**Contact:**
- GitHub Issues: [https://github.com/keyikoi/flywise/issues](https://github.com/keyikoi/flywise/issues)
- Email: zhangkeyi.zky@alibaba-inc.com

---

## 📄 License

MIT License
