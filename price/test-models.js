const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 读取配置
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

// 要测试的模型列表
const MODELS = [
  'qwen3.5-plus',
  'qwen3-max-2026-01-23',
  'qwen3-coder-next',
  'qwen3-coder-plus',
  'glm-5',
  'glm-4.7',
  'kimi-k2.5',
  'MiniMax-M2.5',
];

// 测试 prompt（与 server.js 中意图提取用的相同）
const SYSTEM_PROMPT = `你是一个航班搜索助手的意图识别模块。请分析用户的消息，提取航班搜索相关信息。

请以 JSON 格式返回，不要包含其他内容：
{
  "intent": "flight_search" 或 "general_chat",
  "origin": "出发城市的 IATA 机场代码（如 PVG、SHA、PEK）",
  "originCity": "出发城市中文名",
  "destination": "目的地的 IATA 机场代码",
  "destinationCity": "目的地城市中文名",
  "departDate": "出发日期，格式 YYYY-MM-DD",
  "returnDate": null,
  "passengers": 1,
  "cabinClass": "economy"
}

注意：
- 如果没有明确出发地默认上海（PVG）
- 如果没有明确日期使用最近合理的未来日期
- 今天是 2026-03-23
- 常见城市代码：上海浦东PVG、北京PEK、广州CAN、深圳SZX、东京NRT、大阪KIX、首尔ICN、曼谷BKK、新加坡SIN、香港HKG
- 与航班无关的消息 intent 设为 "general_chat"`;

// 测试用户输入
const TEST_INPUT = '我想下周三从上海飞东京';

/**
 * 测试单个模型
 */
async function testModel(modelName) {
  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: TEST_INPUT },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const content = response.choices[0]?.message?.content || '';

    // 尝试解析 JSON
    let parsed = null;
    let jsonValid = false;
    let error = null;

    try {
      parsed = JSON.parse(content);
      jsonValid = true;
    } catch (e) {
      error = 'JSON 解析失败';
    }

    // 检查关键字段
    const origin = parsed?.origin || null;
    const destination = parsed?.destination || null;
    const departDate = parsed?.departDate || null;
    const hasRequiredFields = origin && destination && departDate;

    return {
      model: modelName,
      success: true,
      duration,
      jsonValid,
      hasRequiredFields,
      origin,
      destination,
      departDate,
      error: hasRequiredFields ? null : (error || '缺少必要字段'),
      rawContent: content,
    };
  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      model: modelName,
      success: false,
      duration,
      jsonValid: false,
      hasRequiredFields: false,
      origin: null,
      destination: null,
      departDate: null,
      error: err.message || '未知错误',
      rawContent: null,
    };
  }
}

/**
 * 格式化时间，右对齐
 */
function formatDuration(ms) {
  return `${ms}ms`.padStart(6);
}

/**
 * 格式化模型名称，固定宽度
 */
function formatModelName(name) {
  return name.padEnd(22);
}

/**
 * 主函数
 */
async function main() {
  console.log('\n🧪 航班意图提取模型对比测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝 测试输入: "${TEST_INPUT}"`);
  console.log(`⏱️  开始并行测试 ${MODELS.length} 个模型...\n`);

  // 并行调用所有模型
  const startTime = Date.now();
  const results = await Promise.allSettled(MODELS.map(model => testModel(model)));
  const totalTime = Date.now() - startTime;

  // 处理结果
  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        model: MODELS[index],
        success: false,
        duration: 0,
        jsonValid: false,
        hasRequiredFields: false,
        origin: null,
        destination: null,
        departDate: null,
        error: result.reason?.message || '未知错误',
        rawContent: null,
      };
    }
  });

  // 按响应时间排序
  processedResults.sort((a, b) => {
    // 失败的排在后面
    if (a.success !== b.success) return a.success ? -1 : 1;
    return a.duration - b.duration;
  });

  // 打印结果
  console.log('测试结果（按响应时间排序）：\n');
  
  for (const r of processedResults) {
    const status = r.success ? '✅' : '❌';
    const modelName = formatModelName(r.model);
    const duration = formatDuration(r.duration);
    
    if (r.success && r.hasRequiredFields) {
      const route = `${r.origin} → ${r.destination}`;
      const jsonStatus = r.jsonValid ? 'JSON ✓' : 'JSON ✗';
      console.log(`${status} ${modelName} | ${duration} | ${route.padEnd(12)} | ${r.departDate} | ${jsonStatus}`);
    } else if (r.success) {
      console.log(`${status} ${modelName} | ${duration} | 结果不完整: ${r.error}`);
    } else {
      console.log(`${status} ${modelName} | ${duration} | 失败: ${r.error}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⏱️  总耗时: ${totalTime}ms (并行执行)\n`);

  // 找出最佳模型
  const successfulResults = processedResults.filter(r => r.success && r.hasRequiredFields && r.jsonValid);
  
  if (successfulResults.length > 0) {
    const best = successfulResults[0];
    console.log(`🏆 推荐: ${best.model} (最快且结果正确，耗时 ${best.duration}ms)`);
    
    // 如果有多个成功的，列出前三名
    if (successfulResults.length > 1) {
      console.log('\n📊 Top 3 候选:');
      successfulResults.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.model} - ${r.duration}ms`);
      });
    }
  } else {
    console.log('❌ 没有模型成功完成测试');
  }

  // 打印详细统计
  console.log('\n📈 统计:');
  console.log(`   成功: ${successfulResults.length}/${MODELS.length}`);
  console.log(`   失败: ${processedResults.filter(r => !r.success).length}/${MODELS.length}`);
  console.log(`   结果不完整: ${processedResults.filter(r => r.success && !r.hasRequiredFields).length}/${MODELS.length}`);
  
  console.log('\n');
}

main().catch(console.error);
