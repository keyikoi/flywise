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

// 读取配置文件
const config = require('./config.json');

const app = express();
const PORT = 3001;

// SerpAPI Key（从配置文件读取）
const SERPAPI_KEY = config.serpapi.apiKey;

// OpenAI 客户端（从配置文件读取）
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

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
  "intent": "flight_search" | "general_chat",
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
- 如果用户消息与航班搜索无关，intent 设为 "general_chat"，其他字段可为 null

用户消息：${userMessage}`;
}

// 航班总结 prompt 模板
function getFlightSummaryPrompt(originCity, destinationCity, departDate, flights) {
  return `你是 FlyWise 航班助手，专业、友好、简洁。
用户搜索了从 ${originCity} 到 ${destinationCity} ${departDate} 的航班。
以下是搜索到的航班数据：
${JSON.stringify(flights, null, 2)}

请用中文生成简洁的航班总结，包括：
1. 搜索概览（找到几个航班、价格区间）
2. 简要亮点（最便宜的、最快的等）
3. 购买建议

注意：不需要列出每个航班的详细信息（前端会用卡片展示），只需要总结和分析。
使用 markdown 格式，适当使用加粗和 emoji。控制在 200 字以内。`;
}

// 通用对话 prompt 模板
function getGeneralChatPrompt(userMessage) {
  return `你是 FlyWise 航班助手。请友好地回复用户的消息。如果用户想搜索航班，引导他们提供目的地和出发日期。

用户消息：${userMessage}`;
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

    flights.push({
      id: index + 1,
      airline: firstLeg.airline,
      airline_code: firstLeg.airline?.substring(0, 2),
      flight_number: firstLeg.flight_number,
      origin: firstLeg.departure_airport?.id,
      origin_name: firstLeg.departure_airport?.name,
      destination: lastLeg.arrival_airport?.id,
      destination_name: lastLeg.arrival_airport?.name,
      depart_time: firstLeg.departure_airport?.time?.split(' ')[1] || '',
      arrive_time: lastLeg.arrival_airport?.time?.split(' ')[1] || '',
      duration: `${Math.floor(group.total_duration / 60)}h${group.total_duration % 60}m`,
      price: group.price,
      currency: 'CNY',
      stops: group.flights.length - 1,
      stop_cities: (group.layovers || []).map((l) => l.name),
      layoverDurationFormatted: (group.layovers || [])
        .map((l) => `${Math.floor(l.duration / 60)}h${l.duration % 60}m`)
        .join(', '),
    });
  });

  return flights;
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
 * Step 2: 调用 SerpAPI 搜索航班
 */
async function searchFlights(origin, destination, departDate) {
  console.log(`[Step 2] 搜索航班: ${origin} -> ${destination}, ${departDate}`);

  const params = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERPAPI_KEY,
    departure_id: origin,
    arrival_id: destination,
    outbound_date: departDate,
    currency: 'CNY',
    hl: 'zh-cn',
    type: '2', // 单程
  });

  const serpApiUrl = `https://serpapi.com/search.json?${params.toString()}`;
  const response = await fetch(serpApiUrl);
  const data = await response.json();

  if (!response.ok) {
    console.error('[Step 2] SerpAPI 请求失败:', data);
    throw new Error('SerpAPI 请求失败');
  }

  const flights = parseFlights(data);
  console.log(`[Step 2] 搜索成功，找到 ${flights.length} 个航班`);
  return { flights, rawData: data };
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

/**
 * POST /api/chat
 * 完整的单轮对话编排流程
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

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

    // ========== Step 2 & 3: 根据意图行动 ==========
    if (extraction.intent === 'flight_search') {
      // 意图是航班搜索
      let flights = [];
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
      } catch (error) {
        console.error('[Step 2] 航班搜索失败:', error.message);
        // 搜索失败时，仍然生成一个友好的回复
        const errorReply = await generateReply(
          `用户想搜索从 ${extraction.originCity} 到 ${extraction.destinationCity} ${extraction.departDate} 的航班，但搜索失败了。请友好地告知用户，并建议稍后重试。`
        );
        return res.json({
          reply: errorReply,
          data: {
            type: 'flights',
            extraction: searchParams,
            flights: [],
            searchParams,
            error: '航班搜索暂时不可用',
          },
        });
      }

      // Step 3: LLM 生成航班总结
      let reply;
      try {
        if (flights.length > 0) {
          reply = await generateReply(
            getFlightSummaryPrompt(
              extraction.originCity,
              extraction.destinationCity,
              extraction.departDate,
              flights.slice(0, 10) // 只传前 10 个航班给 LLM
            )
          );
        } else {
          reply = await generateReply(
            `用户搜索了从 ${extraction.originCity} 到 ${extraction.destinationCity} ${extraction.departDate} 的航班，但没有找到结果。请友好地告知用户，并建议尝试其他日期。`
          );
        }
      } catch (error) {
        console.error('[Step 3] 回复生成失败:', error.message);
        reply = `找到了 ${flights.length} 个从 ${extraction.originCity} 到 ${extraction.destinationCity} 的航班。`;
      }

      // Step 4: 返回结构化响应
      return res.json({
        reply,
        data: {
          type: 'flights',
          extraction: searchParams,
          flights,
          searchParams,
        },
      });
    } else {
      // 意图是通用对话
      let reply;
      try {
        reply = await generateReply(getGeneralChatPrompt(message));
      } catch (error) {
        console.error('[Step 3] 回复生成失败:', error.message);
        reply = '抱歉，我暂时无法回复。请稍后再试。';
      }

      return res.json({
        reply,
        data: {
          type: 'chat',
        },
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
  console.log('─'.repeat(40));
  console.log(`📍 本地访问: http://localhost:${PORT}`);
  console.log(`📍 网络访问: http://127.0.0.1:${PORT}`);
  console.log('─'.repeat(40));
  console.log('📡 API 端点:');
  console.log(`   POST /api/flights/search - 搜索航班（向后兼容）`);
  console.log(`   POST /api/chat          - AI 对话（完整编排流程）`);
  console.log('─'.repeat(40));
  console.log(`🔑 SerpAPI Key: 已配置`);
  console.log(`🔑 OpenAI Key: ${config.openai.apiKey && config.openai.apiKey !== 'your-openai-api-key' ? '已配置' : '⚠️ 未配置 (请在 config.json 中设置)'}`);
  console.log(`🤖 OpenAI Model: ${config.openai.model}`);
  console.log(`🌐 OpenAI BaseURL: ${config.openai.baseURL}`);
  console.log('');
});
