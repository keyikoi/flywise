const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname)));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 服务已启动！`);
  console.log(`💻 电脑预览: http://localhost:${PORT}`);
  console.log(`📱 手机预览: http://0.0.0.0:${PORT} (替换为你的局域网IP)`);
});
