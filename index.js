const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/models/database');
const imageRoutes = require('./src/routes/imageRoutes');
const { specs, swaggerUi } = require('./src/config/swagger');

// 加载环境变量
require('dotenv').config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors()); // 启用CORS
app.use(express.json({ charset: 'utf-8' })); // 解析JSON请求体，设置UTF-8编码
app.use(express.urlencoded({ extended: true, charset: 'utf-8' })); // 解析URL编码的请求体，设置UTF-8编码

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/images', imageRoutes);

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '图片托管服务API文档'
}));

// 根路径
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '欢迎使用图片托管服务API',
    endpoints: {
      upload: 'POST /api/images/upload',
      list: 'GET /api/images/list',
      getByHash: 'GET /api/images/hash/:hash',
      delete: 'DELETE /api/images/:id',
      batchDelete: 'POST /api/images/batch-delete',
      health: 'GET /health',
      docs: 'GET /api-docs - Swagger API文档'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 启动服务器
const PORT = process.env.PORT || 40001;

async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('数据库连接失败，服务启动终止');
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器已启动，端口: ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
      console.log(`API文档: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动应用
startServer();