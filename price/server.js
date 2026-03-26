/**
 * FlyWise 航班助手后端代理服务器
 * 
 * 解决两个核心问题：
 * 1. 代理 SerpAPI 请求（解决浏览器 CORS 限制）
 * 2. 代理 OpenAI API 请求（让 AI 回复真正智能化）
 * 
 * 新功能：完整的单轮对话编排流程
 * - 用户输入自然语言 -> LLM 提取意图 -> SerpAPI 搜索 -> LLM 生成回复
 */

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 读取配置文件
const config = require('./config.json');

// 引入航班服务（整合 SerpAPI 和 FlyAI）
const { flightService, DataSource } = require('./api/flightService');
// 引入图表生成器
const { generatePriceChartWithStats } = require('./utils/chartGenerator');

const app = express();
const PORT = 3001;

// SerpAPI Key（从配置文件读取）
const SERPAPI_KEY = config.serpapi.apiKey;

// FlyAI 配置（可选）
const FLYAI_API_KEY = config.flyai?.apiKey;

// OpenAI 客户端（从配置文件读取）
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

// ========== 会话持久化配置 ==========
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

/**
 * 确保 data 目录存在
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[Session] 创建 data 目录');
  }
}

/**
 * 从文件读取会话数据
 */
function loadSessions() {
  try {
    ensureDataDir();
    if (!fs.existsSync(SESSIONS_FILE)) {
      // 文件不存在，返回空数组
      return [];
    }
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.sessions || [];
  } catch (error) {
    console.error('[Session] 读取会话失败:', error.message);
    return [];
  }
}

/**
 * 将会话数据写入文件
 */
function saveSessions(sessions) {
  try {
    ensureDataDir();
    const data = { sessions };
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Session] 保存成功，共 ${sessions.length} 个会话`);
    return true;
  } catch (error) {
    console.error('[Session] 保存会话失败:', error.message);
    return false;
  }
}

/**
 * 生成 UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * 根据用户消息或意图生成会话标题
 */
function generateSessionTitle(userMessage, extraction) {
  // 如果有航班搜索意图，使用意图信息生成标题
  if (extraction && extraction.intent === 'flight_search' && extraction.originCity && extraction.destinationCity) {
    return `${extraction.originCity}→${extraction.destinationCity}航班查询`;
  }
  // 否则使用用户消息前20个字
  return userMessage.substring(0, 20) + (userMessage.length > 20 ? '...' : '');
}

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - serve price 目录下的静态文件
app.use(express.static(path.join(__dirname)));

// 获取当前日期（格式：YYYY-MM-DD）
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 意图提取 prompt 模板
function getExtractionPrompt(userMessage) {
  return `你是一个航班搜索助手的意图识别模块。请分析用户的消息，提取航班搜索相关信息。

请以 JSON 格式返回，不要包含其他内容：
{
  "intent": "flight_search" | "price_recommendation" | "general_chat",
  "origin": "出发城市的 IATA 机场代码（如 PVG、SHA、PEK）",
  "originCity": "出发城市中文名",
  "destination": "目的地的 IATA 机场代码",
  "destinationCity": "目的地城市中文名",
  "departDate": "出发日期，格式 YYYY-MM-DD",
  "returnDate": "返回日期（如有），格式 YYYY-MM-DD，无则 null",
  "passengers": 1,
  "cabinClass": "economy | business | first"
}

注意：
- 如果用户没有明确说出发地，默认为上海（PVG）
- 如果用户没有明确日期，使用最近合理的日期
- 今天是 ${getCurrentDate()}
- 常见城市代码：上海浦东PVG、上海虹桥SHA、北京首都PEK、北京大兴PKX、广州CAN、深圳SZX、东京成田NRT、东京羽田HND、大阪KIX、首尔ICN、曼谷BKK、新加坡SIN、香港HKG、台北TPE、纽约JFK、伦敦LHR、巴黎CDG
- 如果用户询问是否该购买、现在买还是等等、价格走势建议、该不该入手、价格会降吗等，intent 设为 "price_recommendation"
- 如果用户消息与航班搜索无关，intent 设为 "general_chat"，其他字段可为 null

用户消息：${userMessage}`;
}

// 航班总结 prompt 模板（简洁版，只展示3个推荐航班）
function getFlightSummaryPrompt(originCity, destinationCity, departDate, totalCount, recommendedFlights) {
  // 格式化日期为更友好的格式（如 "3月28日"）
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  const formattedDate = formatDate(departDate);
  
  return `你是 FlyWise 航班助手，专业、友好、简洁。
用户搜索了从 ${originCity} 到 ${destinationCity} ${departDate} 的航班。
共找到 ${totalCount} 个航班，为用户精选了 ${recommendedFlights.length} 个推荐：
${JSON.stringify(recommendedFlights, null, 2)}

请用中文生成简洁的搜索总结（100字内），不需要列出航班详情（前端会用卡片展示推荐航班）。

【重要】回复开头必须包含出发日期，格式示例：
- "${originCity}→${destinationCity} **${formattedDate}** 航班精选"
- "为您精选 **${formattedDate}** ${originCity}飞${destinationCity}的航班"

可以简要提及价格区间和推荐亮点。使用 markdown 格式，适当使用加粗和 emoji。`;
}

// 通用对话 prompt 模板
function getGeneralChatPrompt(userMessage) {
  return `你是 FlyWise 航班助手。请友好地回复用户的消息。如果用户想搜索航班，引导他们提供目的地和出发日期。

用户消息：${userMessage}`;
}

/**
 * 生成购买建议
 */
function generateRecommendation(flights, priceInsights) {
    if (!flights || flights.length === 0) return null;
    
    // 获取最低价航班的价格作为 currentPrice
    const cheapestFlight = flights.reduce((min, f) => f.price < min.price ? f : min, flights[0]);
    const currentPrice = cheapestFlight.price;
    
    // 如果有 priceInsights，基于它生成建议
    if (priceInsights) {
        const { lowestPrice, typicalPriceRange, priceLevel } = priceInsights;
        const [typicalLow, typicalHigh] = typicalPriceRange || [0, 0];
        const average = typicalLow && typicalHigh ? Math.round((typicalLow + typicalHigh) / 2) : currentPrice;
        
        if (priceLevel === 'low' || currentPrice <= typicalLow) {
            // 低价 → 建议购买
            const discount = average > 0 ? Math.round((1 - currentPrice / average) * 100) : 0;
            return {
                action: 'buy',
                confidence: Math.min(95, 70 + Math.abs(discount)),
                reason: `当前价格 ¥${currentPrice.toLocaleString()} 处于低位，比历史均价低约 ${discount}%，是近期的好价格。`,
                currentPrice,
                averagePrice: average,
                expectedDrop: 0,
                waitUntil: null
            };
        } else if (priceLevel === 'high' || currentPrice >= typicalHigh) {
            // 高价 → 建议等待
            const expectedDrop = Math.round(currentPrice * 0.12);
            return {
                action: 'wait',
                confidence: Math.min(90, 65 + Math.round((currentPrice - average) / average * 50)),
                reason: `当前价格偏高，高于典型价格区间。建议关注价格变化，等待降价后再入手。`,
                currentPrice,
                averagePrice: average,
                expectedDrop,
                waitUntil: '1-2 周'
            };
        } else {
            // 中等 → 建议购买（价格合理）
            return {
                action: 'buy',
                confidence: 65,
                reason: `当前价格处于合理区间，如果行程已确定，建议尽早锁定。`,
                currentPrice,
                averagePrice: average,
                expectedDrop: 0,
                waitUntil: null
            };
        }
    }
    
    // 没有 priceInsights 时的 fallback
    return {
        action: 'buy',
        confidence: 55,
        reason: `基于当前搜索到的航班价格，建议确认行程后尽早预订。`,
        currentPrice,
        averagePrice: null,
        expectedDrop: 0,
        waitUntil: null
    };
}

/**
 * 生成购买建议的 AI 回复 prompt
 */
function getRecommendationPrompt(recommendation) {
    return `你是 FlyWise 航班助手。用户询问是否应该现在购买机票。
分析结果：${recommendation.action === 'buy' ? '建议现在购买' : '建议继续观望'}
置信度：${recommendation.confidence}%
原因：${recommendation.reason}
当前最低价：¥${recommendation.currentPrice}
${recommendation.averagePrice ? '历史均价：¥' + recommendation.averagePrice : ''}

请用简洁友好的中文（50字以内）给出建议。不要重复详细数据（前端会展示卡片）。用 markdown 格式。`;
}

/**
 * 解析 SerpAPI 航班响应
 */
function parseFlights(data) {
  const flights = [];
  const allFlightGroups = [
    ...(data.best_flights || []),
    ...(data.other_flights || []),
  ];

  allFlightGroups.forEach((group, index) => {
    const firstLeg = group.flights?.[0];
    const lastLeg = group.flights?.[group.flights.length - 1];
    if (!firstLeg) return;

    const totalDurationMinutes = group.total_duration || 0;
    flights.push({
      id: index + 1,
      airline: firstLeg.airline,
      airline_logo: firstLeg.airline_logo || '',
      airline_code: firstLeg.airline?.substring(0, 2),
      flight_number: firstLeg.flight_number,
      origin: firstLeg.departure_airport?.id,
      origin_name: firstLeg.departure_airport?.name,
      destination: lastLeg.arrival_airport?.id,
      destination_name: lastLeg.arrival_airport?.name,
      depart_time: firstLeg.departure_airport?.time?.split(' ')[1] || '',
      arrive_time: lastLeg.arrival_airport?.time?.split(' ')[1] || '',
      duration: `${Math.floor(totalDurationMinutes / 60)}h${totalDurationMinutes % 60}m`,
      total_duration_minutes: totalDurationMinutes, // 用于筛选
      price: group.price,
      currency: 'CNY',
      stops: group.flights.length - 1,
      // 提取中转城市名：优先使用 city 字段，否则从机场全名中提取城市名
      stop_cities: (group.layovers || []).map((l) => {
        // 如果有 city 字段，直接使用
        if (l.city) return l.city;
        // 否则从机场名中提取城市名：去掉"国际机场"、"机场"等后缀
        const name = l.name || '';
        return name
          .replace(/白云国际机场$/, '')
          .replace(/首都国际机场$/, '')
          .replace(/大兴国际机场$/, '')
          .replace(/浦东国际机场$/, '')
          .replace(/虹桥国际机场$/, '')
          .replace(/国际机场$/, '')
          .replace(/机场$/, '')
          .trim() || name;
      }),
      layoverDurationFormatted: (group.layovers || [])
        .map((l) => `${Math.floor(l.duration / 60)}h${l.duration % 60}m`)
        .join(', '),
    });
  });

  return flights;
}

/**
 * 提取 SerpAPI 的 price_insights 数据
 */
function extractPriceInsights(data) {
  const insights = data.price_insights;
  if (!insights) return null;

  return {
    lowestPrice: insights.lowest_price || null,
    priceLevel: insights.price_level || null,
    typicalPriceRange: insights.typical_price_range || null,
    priceHistory: insights.price_history || null,
  };
}

/**
 * 筛选3个推荐航班：价格最低、耗时最短、综合最优
 */
function selectRecommendedFlights(flights) {
  if (!flights || flights.length === 0) return [];
  if (flights.length <= 3) {
    // 航班不足3个，为每个航班添加标签
    return flights.map((f, i) => ({
      ...f,
      tag: i === 0 ? 'cheapest' : i === 1 ? 'fastest' : 'best',
      tagLabel: i === 0 ? '价格最低' : i === 1 ? '耗时最短' : '综合最优',
      recommendation: i === 0 ? `¥${f.price}，最优惠选择` : i === 1 ? `${f.duration}，快速到达` : '综合推荐',
    }));
  }

  // 计算价格和时长的最小最大值用于归一化
  const prices = flights.map(f => f.price).filter(p => p != null);
  const durations = flights.map(f => f.total_duration_minutes).filter(d => d != null && d > 0);
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  // 计算均价
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  // 归一化函数（越低越好，所以结果是 1 - normalized）
  const normalizePrice = (price) => {
    if (maxPrice === minPrice) return 0.5;
    return (price - minPrice) / (maxPrice - minPrice);
  };
  const normalizeDuration = (duration) => {
    if (maxDuration === minDuration) return 0.5;
    return (duration - minDuration) / (maxDuration - minDuration);
  };

  // 计算综合评分（越低越好）
  const getScore = (flight) => {
    const priceScore = normalizePrice(flight.price || maxPrice);
    const durationScore = normalizeDuration(flight.total_duration_minutes || maxDuration);
    return priceScore * 0.6 + durationScore * 0.4;
  };

  // 排序找出各类最优
  const sortedByPrice = [...flights].sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  const sortedByDuration = [...flights].sort((a, b) => (a.total_duration_minutes || Infinity) - (b.total_duration_minutes || Infinity));
  const sortedByScore = [...flights].sort((a, b) => getScore(a) - getScore(b));

  const recommended = [];
  const usedIds = new Set();

  // 1. 价格最低
  const cheapest = sortedByPrice[0];
  if (cheapest) {
    const priceDiff = avgPrice - cheapest.price;
    recommended.push({
      ...cheapest,
      tag: 'cheapest',
      tagLabel: '价格最低',
      recommendation: priceDiff > 0 
        ? `¥${cheapest.price}，比均价低¥${priceDiff}` 
        : `¥${cheapest.price}，最优惠选择`,
    });
    usedIds.add(cheapest.id);
  }

  // 2. 耗时最短（避免重复）
  for (const flight of sortedByDuration) {
    if (!usedIds.has(flight.id)) {
      const stops = flight.stops === 0 ? '直达' : `${flight.stops}次转机`;
      recommended.push({
        ...flight,
        tag: 'fastest',
        tagLabel: '耗时最短',
        recommendation: `${flight.duration}${stops}，最快到达`,
      });
      usedIds.add(flight.id);
      break;
    }
  }

  // 3. 综合最优（避免重复）
  for (const flight of sortedByScore) {
    if (!usedIds.has(flight.id)) {
      recommended.push({
        ...flight,
        tag: 'best',
        tagLabel: '综合最优',
        recommendation: '价格适中、时间合理，综合推荐',
      });
      usedIds.add(flight.id);
      break;
    }
  }

  // 如果因为重复导致不足3个，从剩余航班中补充
  if (recommended.length < 3) {
    for (const flight of sortedByScore) {
      if (!usedIds.has(flight.id)) {
        recommended.push({
          ...flight,
          tag: 'best',
          tagLabel: '综合最优',
          recommendation: '性价比之选',
        });
        usedIds.add(flight.id);
        if (recommended.length >= 3) break;
      }
    }
  }

  return recommended;
}

/**
 * Step 1: 调用 LLM 提取意图和参数
 */
async function extractIntent(userMessage) {
  console.log(`[Step 1] 提取意图: "${userMessage.substring(0, 50)}..."`);

  const completion = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'user', content: getExtractionPrompt(userMessage) },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  console.log(`[Step 1] 意图提取结果:`, result);
  return result;
}


/**
 * Step 2: 调用航班服务搜索航班（使用 flightService 统一接口）
 * 国内航线使用 FlyAI，国际航线使用 SerpAPI
 */
async function searchFlights(origin, destination, departDate, returnDate = null) {
  console.log(`[Step 2] 搜索航班：${origin} -> ${destination}, ${departDate}`);

  try {
    // 使用 flightService 统一接口（自动选择数据源）
    const result = await flightService.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      dataSource: 'auto', // 自动选择：国内用 FlyAI，国际用 SerpAPI
    });

    if (result.success && result.flights && result.flights.length > 0) {
      console.log(`[Step 2] 搜索成功，找到 ${result.flights.length} 个航班，数据源：${result.source}`);

      // 构建 priceInsights（兼容前端格式）
      let priceInsights = null;
      const priceHistory = await flightService.getPriceHistory({
        origin,
        destination,
        date: departDate,
      });

      if (priceHistory && priceHistory.priceHistory) {
        // 将自有数据转换为 SerpAPI 格式 [[timestamp, price], ...]
        const formattedHistory = priceHistory.priceHistory.map(item => {
          const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
          return [timestamp, item.price];
        });

        // 添加当前价格到图表末尾（如果当前价格不在历史数据中）
        if (priceHistory.currentPrice) {
          const today = Math.floor(Date.now() / 1000);
          const lastPrice = formattedHistory.length > 0 ? formattedHistory[formattedHistory.length - 1][1] : null;
          // 如果当前价格与最后一条记录不同，添加到末尾
          if (lastPrice !== priceHistory.currentPrice) {
            formattedHistory.push([today, priceHistory.currentPrice]);
          }
        }

        priceInsights = {
          lowestPrice: priceHistory.currentPrice || priceHistory.minPrice, // 当前价格
          priceLevel: priceHistory.priceLevel === 'low' ? 'low' : priceHistory.priceLevel === 'high' ? 'high' : 'typical',
          typicalPriceRange: [priceHistory.minPrice, priceHistory.maxPrice],
          priceHistory: formattedHistory,
          dataSource: priceHistory.dataSource,
          currentPrice: priceHistory.currentPrice, // 明确传递当前价格
        };
      }

      // 给每个航班添加 source 标记
      const flightsWithSource = (result.flights || []).map(f => ({
        ...f,
        source: f.source || result.source || 'unknown',
      }));

      return {
        flights: flightsWithSource,
        priceInsights,
        rawData: result,
      };
    }
  } catch (error) {
    console.error('[Step 2] flightService 搜索失败:', error.message);
  }

  // Fallback: 降级到 SerpAPI
  console.log('[Step 2] 降级到 SerpAPI 搜索');
  const params = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERPAPI_KEY,
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departDate,
    currency: 'CNY',
    hl: 'zh-cn',
    type: '2',
  });

  const serpApiUrl = `https://serpapi.com/search.json?${params.toString()}`;
  const response = await fetch(serpApiUrl);
  const data = await response.json();

  if (!response.ok || !data.best_flights) {
    console.error('[Step 2] SerpAPI 请求失败:', data);
    throw new Error('航班搜索失败');
  }

  const flights = parseFlights(data);
  const priceInsights = extractPriceInsights(data);

  // 给每个航班添加 source 标记
  const flightsWithSource = flights.map(f => ({
    ...f,
    source: f.source || 'serpapi',
  }));

  console.log(`[Step 2] SerpAPI 搜索成功，找到 ${flights.length} 个航班`);
  return { flights: flightsWithSource, priceInsights, rawData: data };
}

/**
 * Step 3: 调用 LLM 生成回复
 */
async function generateReply(prompt) {
  console.log(`[Step 3] 生成回复...`);

  const completion = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const reply = completion.choices[0]?.message?.content || '抱歉，我无法生成回复。';
  console.log(`[Step 3] 回复生成成功`);
  return reply;
}

// ========== 会话管理 API 端点 ==========

/**
 * GET /api/sessions
 * 返回会话列表（不包含完整消息，只有预览）
 * 按 updatedAt 倒序排列
 */
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = loadSessions();
    
    // 按 updatedAt 倒序排列
    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    
    // 返回列表，不包含完整消息
    const sessionList = sortedSessions.map(session => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages?.length || 0,
      preview: session.messages?.[0]?.content?.substring(0, 50) || ''
    }));
    
    console.log(`[GET /api/sessions] 返回 ${sessionList.length} 个会话`);
    res.json(sessionList);
  } catch (error) {
    console.error('[GET /api/sessions] 错误:', error.message);
    res.status(500).json({ error: '获取会话列表失败', message: error.message });
  }
});

/**
 * GET /api/sessions/:id
 * 返回完整会话（包含所有消息）
 */
app.get('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sessions = loadSessions();
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    console.log(`[GET /api/sessions/:id] 返回会话: ${session.title}`);
    res.json(session);
  } catch (error) {
    console.error('[GET /api/sessions/:id] 错误:', error.message);
    res.status(500).json({ error: '获取会话失败', message: error.message });
  }
});

/**
 * POST /api/sessions
 * 创建新会话
 */
app.post('/api/sessions', (req, res) => {
  try {
    const { title } = req.body;
    const now = new Date().toISOString();
    
    const newSession = {
      id: generateUUID(),
      title: title || '新会话',
      createdAt: now,
      updatedAt: now,
      messages: []
    };
    
    const sessions = loadSessions();
    sessions.push(newSession);
    saveSessions(sessions);
    
    console.log(`[POST /api/sessions] 创建会话: ${newSession.title}`);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('[POST /api/sessions] 错误:', error.message);
    res.status(500).json({ error: '创建会话失败', message: error.message });
  }
});

/**
 * DELETE /api/sessions/:id
 * 删除指定会话
 */
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const { id } = req.params;
    let sessions = loadSessions();
    const index = sessions.findIndex(s => s.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: '会话不存在' });
    }
    
    const deletedSession = sessions[index];
    sessions.splice(index, 1);
    saveSessions(sessions);
    
    console.log(`[DELETE /api/sessions/:id] 删除会话: ${deletedSession.title}`);
    res.json({ success: true, message: '会话已删除' });
  } catch (error) {
    console.error('[DELETE /api/sessions/:id] 错误:', error.message);
    res.status(500).json({ error: '删除会话失败', message: error.message });
  }
});

/**
 * POST /api/chat
 * 完整的单轮对话编排流程
 * 支持会话持久化：传入 sessionId 则保存到对应会话，否则创建新会话
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: '缺少消息内容',
        required: ['message'],
      });
    }

    // 检查 OpenAI API Key
    if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key') {
      console.error('[OpenAI] 未配置 OpenAI API Key');
      return res.status(500).json({
        error: 'OpenAI API Key 未配置',
        message: '请在 config.json 中设置 openai.apiKey',
      });
    }

    // ========== Step 1: LLM 提取意图和参数 ==========
    let extraction;
    try {
      extraction = await extractIntent(message);
    } catch (error) {
      console.error('[Step 1] 意图提取失败:', error.message);
      return res.status(500).json({
        error: '意图提取失败',
        message: error.message,
      });
    }

    // ========== 会话管理：获取或创建会话 ==========
    let sessions = loadSessions();
    let currentSession = null;
    let currentSessionId = sessionId;
    const now = new Date().toISOString();

    if (sessionId) {
      // 使用现有会话
      currentSession = sessions.find(s => s.id === sessionId);
      if (!currentSession) {
        return res.status(404).json({ error: '会话不存在' });
      }
      console.log(`[Session] 使用现有会话: ${currentSession.title}`);
    } else {
      // 创建新会话
      const title = generateSessionTitle(message, extraction);
      currentSession = {
        id: generateUUID(),
        title,
        createdAt: now,
        updatedAt: now,
        messages: []
      };
      currentSessionId = currentSession.id;
      sessions.push(currentSession);
      console.log(`[Session] 创建新会话: ${title}`);
    }

    // 添加用户消息到会话
    currentSession.messages.push({
      role: 'user',
      content: message
    });
    currentSession.updatedAt = now;

    // ========== Step 2 & 3: 根据意图行动 ==========
    if (extraction.intent === 'flight_search') {
      // 意图是航班搜索
      let flights = [];
      let recommendedFlights = [];
      let priceInsights = null;
      let searchParams = {
        origin: extraction.origin,
        originCity: extraction.originCity,
        destination: extraction.destination,
        destinationCity: extraction.destinationCity,
        departDate: extraction.departDate,
        returnDate: extraction.returnDate,
        passengers: extraction.passengers,
        cabinClass: extraction.cabinClass,
      };

      // Step 2: 调用 SerpAPI 搜索航班
      try {
        const searchResult = await searchFlights(
          extraction.origin,
          extraction.destination,
          extraction.departDate
        );
        flights = searchResult.flights;
        priceInsights = searchResult.priceInsights;
        // 筛选3个推荐航班
        recommendedFlights = selectRecommendedFlights(flights);
        console.log(`[Step 2] 筛选出 ${recommendedFlights.length} 个推荐航班`);
        console.log(`[Step 2] 价格走势结果： ${priceInsights}`);
      } catch (error) {
        console.error('[Step 2] 航班搜索失败:', error.message);
        // 搜索失败时，仍然生成一个友好的回复
        const errorReply = await generateReply(
          `用户想搜索从 ${extraction.originCity} 到 ${extraction.destinationCity} ${extraction.departDate} 的航班，但搜索失败了。请友好地告知用户，并建议稍后重试。`
        );
        
        // 保存 AI 回复到会话
        currentSession.messages.push({
          role: 'assistant',
          content: errorReply,
          data: { type: 'flights', error: '航班搜索暂时不可用' }
        });
        currentSession.updatedAt = new Date().toISOString();
        saveSessions(sessions);
        
        return res.json({
          reply: errorReply,
          data: {
            type: 'flights',
            extraction: searchParams,
            flights: [],
            priceInsights: null,
            searchParams,
            error: '航班搜索暂时不可用',
          },
          sessionId: currentSessionId,
        });
      }

      // Step 3: 获取价格历史（国内使用自有数据，国际使用 SerpAPI）
      let finalPriceInsights = priceInsights;
      try {
        const priceHistory = await flightService.getPriceHistory({
          origin: extraction.origin,
          destination: extraction.destination,
          date: extraction.departDate,
        });

        if (priceHistory && priceHistory.priceHistory) {
          // 将自有数据转换为 SerpAPI 格式 [[timestamp, price], ...]
          const formattedHistory = priceHistory.priceHistory.map(item => {
            const timestamp = Math.floor(new Date(item.date).getTime() / 1000);
            return [timestamp, item.price];
          });

          // 添加当前价格到图表末尾
          if (priceHistory.currentPrice) {
            const today = Math.floor(Date.now() / 1000);
            const lastPrice = formattedHistory.length > 0 ? formattedHistory[formattedHistory.length - 1][1] : null;
            if (lastPrice !== priceHistory.currentPrice) {
              formattedHistory.push([today, priceHistory.currentPrice]);
            }
          }

          finalPriceInsights = {
            lowestPrice: priceHistory.currentPrice || priceHistory.minPrice, // 当前价格
            priceLevel: priceHistory.priceLevel === 'low' ? 'low' : priceHistory.priceLevel === 'high' ? 'high' : 'typical',
            typicalPriceRange: [priceHistory.minPrice, priceHistory.maxPrice],
            priceHistory: formattedHistory,
            dataSource: priceHistory.dataSource,
            currentPrice: priceHistory.currentPrice,
          };
          console.log(`[Step 3] 价格历史已加载：${priceHistory.dataSource}, ${priceHistory.priceHistory.length} 条记录`);
        }
      } catch (error) {
        console.error('[Step 3] 加载价格历史失败:', error.message);
      }

      // 如果还是没有价格历史，尝试从 SerpAPI 获取（国际航线）
      if (!finalPriceInsights && extraction.destination) {
        try {
          console.log('[Step 3] 尝试从 SerpAPI 获取价格历史...');
          const params = new URLSearchParams({
            engine: 'google_flights',
            api_key: SERPAPI_KEY,
            departure_id: extraction.origin,
            arrival_id: extraction.destination,
            outbound_date: extraction.departDate,
            currency: 'CNY',
            hl: 'zh-cn',
            type: '2',
          });

          const serpApiUrl = `https://serpapi.com/search.json?${params.toString()}`;
          const response = await fetch(serpApiUrl);
          const data = await response.json();

          if (data.price_insights && data.price_insights.price_history) {
            finalPriceInsights = {
              lowestPrice: data.price_insights.lowest_price,
              priceLevel: data.price_insights.price_level === 'low' ? 'low' : data.price_insights.price_level === 'high' ? 'high' : 'typical',
              typicalPriceRange: data.price_insights.typical_price_range,
              priceHistory: data.price_insights.price_history,
              dataSource: 'SerpAPI',
            };
            console.log(`[Step 3] SerpAPI 价格历史已加载：${finalPriceInsights.priceHistory.length} 条记录`);
          }
        } catch (error) {
          console.error('[Step 3] SerpAPI 价格历史获取失败:', error.message);
        }
      }

      // Step 4: LLM 生成航班总结
      let reply;
      try {
        if (recommendedFlights.length > 0) {
          reply = await generateReply(
            getFlightSummaryPrompt(
              extraction.originCity,
              extraction.destinationCity,
              extraction.departDate,
              flights.length,
              recommendedFlights
            )
          );
        } else {
          reply = await generateReply(
            `用户搜索了从 ${extraction.originCity} 到 ${extraction.destinationCity} ${extraction.departDate} 的航班，但没有找到结果。请友好地告知用户，并建议尝试其他日期。`
          );
        }
      } catch (error) {
        console.error('[Step 4] 回复生成失败:', error.message);
        reply = `找到了 ${flights.length} 个从 ${extraction.originCity} 到 ${extraction.destinationCity} 的航班，为您精选了 ${recommendedFlights.length} 个推荐。`;
      }

      // 保存 AI 回复到会话
      const responseData = {
        type: 'flights',
        extraction: searchParams,
        flights: recommendedFlights,
        priceInsights: finalPriceInsights,
        searchParams,
        totalFlightsFound: flights.length,
      };
      currentSession.messages.push({
        role: 'assistant',
        content: reply,
        data: responseData
      });
      currentSession.updatedAt = new Date().toISOString();
      saveSessions(sessions);

      // Step 4: 返回结构化响应
      return res.json({
        reply,
        data: responseData,
        sessionId: currentSessionId,
      });
    } else if (extraction.intent === 'price_recommendation') {
      // ========== 意图是购买建议 ==========
      // 从会话历史获取上次搜索数据
      let lastFlights = null;
      let lastPriceInsights = null;
      
      if (currentSession) {
        // 倒序查找最近的航班搜索结果
        for (let i = currentSession.messages.length - 1; i >= 0; i--) {
          const msg = currentSession.messages[i];
          if (msg.data && msg.data.type === 'flights' && msg.data.flights && msg.data.flights.length > 0) {
            lastFlights = msg.data.flights;
            lastPriceInsights = msg.data.priceInsights;
            break;
          }
        }
      }
      
      if (lastFlights && lastFlights.length > 0) {
        const recommendation = generateRecommendation(lastFlights, lastPriceInsights);
        
        // 生成 AI 回复
        let aiReply;
        try {
          aiReply = await generateReply(getRecommendationPrompt(recommendation));
        } catch (error) {
          console.error('[Step 3] 推荐回复生成失败:', error.message);
          aiReply = recommendation.reason;
        }
        
        // 保存并返回
        const responseData = {
          type: 'recommendation',
          recommendation: recommendation
        };
        currentSession.messages.push({
          role: 'assistant',
          content: aiReply,
          data: responseData
        });
        currentSession.updatedAt = new Date().toISOString();
        saveSessions(sessions);
        
        return res.json({
          reply: aiReply,
          data: responseData,
          sessionId: currentSessionId,
        });
      } else {
        // 没有找到历史航班数据
        const noDataReply = '请先搜索航班，我才能给出购买建议哦～比如告诉我"我想从上海飞东京"';
        
        currentSession.messages.push({
          role: 'assistant',
          content: noDataReply,
          data: { type: 'chat' }
        });
        currentSession.updatedAt = new Date().toISOString();
        saveSessions(sessions);
        
        return res.json({
          reply: noDataReply,
          data: { type: 'chat' },
          sessionId: currentSessionId,
        });
      }
    } else {
      // 意图是通用对话
      let reply;
      try {
        reply = await generateReply(getGeneralChatPrompt(message));
      } catch (error) {
        console.error('[Step 3] 回复生成失败:', error.message);
        reply = '抱歉，我暂时无法回复。请稍后再试。';
      }

      // 保存 AI 回复到会话
      currentSession.messages.push({
        role: 'assistant',
        content: reply,
        data: { type: 'chat' }
      });
      currentSession.updatedAt = new Date().toISOString();
      saveSessions(sessions);

      return res.json({
        reply,
        data: {
          type: 'chat',
        },
        sessionId: currentSessionId,
      });
    }
  } catch (error) {
    console.error('[/api/chat] 错误:', error.message);

    // 处理 OpenAI 特定错误
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'OpenAI API Key 无效',
        message: '请检查 config.json 中的 openai.apiKey 是否正确',
      });
    }

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        error: 'OpenAI API 额度不足',
        message: '请检查您的 OpenAI 账户余额',
      });
    }

    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * POST /api/flights/search
 * 代理 SerpAPI Google Flights 请求（向后兼容）
 */
app.post('/api/flights/search', async (req, res) => {
  try {
    const {
      departure_id,
      arrival_id,
      outbound_date,
      return_date,
      type = 1, // 1: 往返, 2: 单程
      currency = 'CNY',
      hl = 'zh-cn',
      gl = 'cn',
      adults = 1,
      children = 0,
      travel_class = 1, // 1: 经济舱
    } = req.body;

    // 验证必填参数
    if (!departure_id || !arrival_id || !outbound_date) {
      return res.status(400).json({
        error: '缺少必填参数',
        required: ['departure_id', 'arrival_id', 'outbound_date'],
      });
    }

    // 构建 SerpAPI 请求 URL
    const params = new URLSearchParams({
      engine: 'google_flights',
      api_key: SERPAPI_KEY,
      departure_id,
      arrival_id,
      outbound_date,
      type: String(type),
      currency,
      hl,
      gl,
      adults: String(adults),
      children: String(children),
      travel_class: String(travel_class),
    });

    // 如果是往返，添加返程日期
    if (type === 1 && return_date) {
      params.append('return_date', return_date);
    }

    const serpApiUrl = `https://serpapi.com/search.json?${params.toString()}`;

    console.log(`[SerpAPI] 搜索航班: ${departure_id} -> ${arrival_id}, ${outbound_date}`);

    const response = await fetch(serpApiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('[SerpAPI] 请求失败:', data);
      return res.status(response.status).json({
        error: 'SerpAPI 请求失败',
        details: data,
      });
    }

    console.log(`[SerpAPI] 搜索成功，返回航班数据`);
    res.json(data);
  } catch (error) {
    console.error('[SerpAPI] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

// ========== FlyAI 集成 API 端点 ==========

/**
 * POST /api/flyai/search
 * 使用 FlyAI 搜索航班（支持双数据源）
 */
app.post('/api/flyai/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departDate,
      returnDate,
      dataSource = 'auto', // 'auto' | 'serpapi' | 'flyai' | 'both'
    } = req.body;

    // 验证必填参数
    if (!origin || !destination || !departDate) {
      return res.status(400).json({
        error: '缺少必填参数',
        required: ['origin', 'destination', 'departDate'],
      });
    }

    console.log(`[FlyAI API] 搜索航班：${origin} -> ${destination}, ${departDate}, 数据源：${dataSource}`);

    // 使用统一的航班服务
    const result = await flightService.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      dataSource,
    });

    res.json(result);
  } catch (error) {
    console.error('[FlyAI API] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * POST /api/flyai/fast-search
 * FlyAI 快速搜索（全品类旅游产品）
 */
app.post('/api/flyai/fast-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        error: '缺少查询参数',
        required: ['query'],
      });
    }

    console.log(`[FlyAI API] 快速搜索：${query}`);
    const result = flightService.fastSearch(query);
    res.json(result);
  } catch (error) {
    console.error('[FlyAI API] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * POST /api/flyai/hotels
 * FlyAI 酒店搜索
 */
app.post('/api/flyai/hotels', async (req, res) => {
  try {
    const {
      destName,
      poiName,
      checkInDate,
      checkOutDate,
      hotelStars,
      sortBy,
    } = req.body;

    if (!destName) {
      return res.status(400).json({
        error: '缺少必填参数',
        required: ['destName'],
      });
    }

    console.log(`[FlyAI API] 搜索酒店：${destName}`);
    const result = flightService.searchHotels({
      destName,
      poiName,
      checkInDate,
      checkOutDate,
      hotelStars,
      sortBy,
    });
    res.json(result);
  } catch (error) {
    console.error('[FlyAI API] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * POST /api/flyai/poi
 * FlyAI 景点搜索
 */
app.post('/api/flyai/poi', async (req, res) => {
  try {
    const {
      cityName,
      keyword,
      category,
    } = req.body;

    if (!cityName) {
      return res.status(400).json({
        error: '缺少必填参数',
        required: ['cityName'],
      });
    }

    console.log(`[FlyAI API] 搜索景点：${cityName}`);
    const result = flightService.searchPoi({
      cityName,
      keyword,
      category,
    });
    res.json(result);
  } catch (error) {
    console.error('[FlyAI API] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * POST /api/price-history
 * 获取价格历史（国内航线使用自有数据，国际航线使用 SerpAPI）
 */
app.post('/api/price-history', async (req, res) => {
  try {
    const {
      origin,
      destination,
      date,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: '缺少必填参数',
        required: ['origin', 'destination'],
      });
    }

    console.log(`[Price History] 查询：${origin} -> ${destination}, ${date || '无指定日期'}`);

    const result = await flightService.getPriceHistory({
      origin,
      destination,
      date,
    });

    if (result) {
      res.json(result);
    } else {
      // 如果没有历史数据，返回空响应
      res.json({
        dataSource: 'none',
        message: '暂无价格历史数据',
      });
    }
  } catch (error) {
    console.error('[Price History] 服务器错误:', error.message);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

/**
 * GET /api/chart/price-trend/:route.png
 * 生成价格趋势图表（PNG 图片）
 */
app.get('/api/chart/price-trend/:route.png', async (req, res) => {
  try {
    const { route } = req.params;
    const { origin, destination } = req.query;

    // 获取价格历史数据
    let priceHistory;
    if (origin && destination) {
      const history = await flightService.getPriceHistory({ origin, destination });
      priceHistory = history?.priceHistory || [];
    } else {
      // 从 route 解析（如 HGH-PEK）
      const [originFromRoute, destinationFromRoute] = route.split('-');
      const history = await flightService.getPriceHistory({
        origin: originFromRoute,
        destination: destinationFromRoute,
      });
      priceHistory = history?.priceHistory || [];
    }

    if (!priceHistory || priceHistory.length === 0) {
      return res.status(404).json({ error: '暂无价格历史数据' });
    }

    // 计算统计数据
    const prices = priceHistory.map(p => p.price);
    const currentPrice = prices[prices.length - 1];
    const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // 生成图表
    const chartBuffer = await generatePriceChartWithStats(priceHistory, {
      currentPrice,
      averagePrice,
      minPrice,
      maxPrice,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.send(chartBuffer);
  } catch (error) {
    console.error('[Chart API] 生成图表失败:', error.message);
    res.status(500).json({
      error: '图表生成失败',
      message: error.message,
    });
  }
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('[Server] 未捕获的错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('');
  console.log('🛫 FlyWise 航班助手后端服务器已启动');
  console.log('─'.repeat(50));
  console.log(`📍 本地访问: http://localhost:${PORT}`);
  console.log(`📍 网络访问: http://127.0.0.1:${PORT}`);
  console.log('─'.repeat(50));
  console.log('📡 API 端点:');
  console.log('   ── 航班搜索 ──');
  console.log(`   POST /api/flights/search  - 搜索航班（SerpAPI，向后兼容）`);
  console.log(`   POST /api/flyai/search    - 搜索航班（双数据源：SerpAPI + FlyAI）`);
  console.log('   ── 旅游服务 (FlyAI) ──');
  console.log(`   POST /api/flyai/fast-search - 快速搜索（全品类）`);
  console.log(`   POST /api/flyai/hotels      - 酒店搜索`);
  console.log(`   POST /api/flyai/poi         - 景点搜索`);
  console.log('   ── 价格历史 ──');
  console.log(`   POST /api/price-history     - 价格历史（国内：自有数据 | 国际：SerpAPI）`);
  console.log('   ── AI 对话 ──');
  console.log(`   POST /api/chat          - AI 对话（完整编排流程）`);
  console.log('   ── 会话管理 ──');
  console.log(`   GET  /api/sessions      - 获取会话列表`);
  console.log(`   GET  /api/sessions/:id  - 获取单个会话`);
  console.log(`   POST /api/sessions      - 创建新会话`);
  console.log(`   DELETE /api/sessions/:id - 删除会话`);
  console.log('─'.repeat(50));
  console.log('🔑 数据源配置:');
  console.log(`   SerpAPI (Google Flights): ${SERPAPI_KEY ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`   FlyAI (飞猪):             ${FLYAI_API_KEY ? '✅ 已配置' : 'ℹ️  未配置（可不配置直接使用）'}`);
  console.log(`   OpenAI Key:               ${config.openai.apiKey && config.openai.apiKey !== 'your-openai-api-key' ? '✅ 已配置' : '⚠️ 未配置'}`);
  console.log(`🤖 OpenAI Model: ${config.openai.model}`);
  console.log(`🌐 OpenAI BaseURL: ${config.openai.baseURL}`);
  console.log(`💾 会话存储: ${SESSIONS_FILE}`);
  console.log('');
});
