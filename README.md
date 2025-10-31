# 图片托管服务 API

基于Node.js + Express + MySQL的S3图床服务，支持图片上传、管理、批量删除，通过哈希值去重，使用S3兼容的对象存储作为后端存储。

## 功能特性

- 图片上传与存储
- 文件哈希去重
- 图片列表查询（支持分页、月份筛选、关键词搜索）
- 单张图片删除
- 批量图片删除
- 根据哈希值查询图片
- 软删除机制
- RESTful API设计
- Swagger文档支持

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MySQL
- **对象存储**: S3兼容存储 (如AWS S3, ClawCloud, MinIO等)
- **文件处理**: Multer
- **哈希计算**: Crypto
- **测试**: Jest + Supertest

## 快速开始

### 前置要求

- Node.js 16.0 或更高版本
- MySQL 8.0 或更高版本
- S3兼容的对象存储服务

### 1. 克隆项目

```bash
git clone https://github.com/your-username/s3-image-hosting.git
cd s3-image-hosting
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例环境变量文件并根据您的配置进行修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=40001
NODE_ENV=production

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=image_hosting
DB_USER=root
DB_PASSWORD=your_password

# S3兼容对象存储配置
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_ENDPOINT=your_s3_endpoint
S3_REGION=your_region
S3_BUCKET=your_bucket_name

# 上传限制
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp
```

### 4. 数据库初始化

创建数据库并执行初始化脚本：

```sql
CREATE DATABASE IF NOT EXISTS image_hosting;
```

然后执行 `database.sql` 文件创建数据库表结构：

```bash
mysql -u root -p image_hosting < database.sql
```

或者使用提供的初始化脚本：

```bash
node scripts/initDatabase.js
```

### 5. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

### 6. 验证安装

访问健康检查端点：
```bash
curl http://localhost:40001/health
```

或者访问API文档：
```
http://localhost:40001/api-docs
```

## API 文档

### 基础信息

- 基础URL: `http://localhost:40001`
- 所有API返回JSON格式数据
- 请求Content-Type: `application/json` 或 `multipart/form-data`（上传文件）

### 主要端点

#### 1. 健康检查

**GET** `/health`

检查服务是否正常运行。

#### 2. 上传图片

**POST** `/api/images/upload`

上传图片文件。

**请求参数**:
- `image` (file, required): 图片文件

#### 3. 获取图片列表

**GET** `/api/images/list`

获取图片列表，支持分页和筛选。

**查询参数**:
- `page` (number, optional): 页码，默认1
- `pageSize` (number, optional): 每页数量，默认10，最大100
- `month` (string, optional): 月份筛选，格式"YYYY-MM"
- `keyword` (string, optional): 关键词搜索，搜索文件名和原始文件名

#### 4. 根据哈希查询图片

**GET** `/api/images/hash/:hash`

根据文件哈希值查询图片。

#### 5. 删除图片

**DELETE** `/api/images/:id`

删除指定ID的图片。

#### 6. 批量删除图片

**DELETE** `/api/images/batch`

批量删除图片。

**请求参数**:
- `ids` (array, required): 要删除的图片ID数组

完整的API文档请访问: `http://localhost:40001/api-docs`

## 部署指南

### 使用PM2部署

1. 安装PM2:
```bash
npm install -g pm2
```

2. 启动应用:
```bash
pm2 start index.js --name "image-hosting"
```

3. 设置开机自启:
```bash
pm2 startup
pm2 save
```

### 使用Docker部署

1. 构建镜像:
```bash
docker build -t s3-image-hosting .
```

2. 运行容器:
```bash
docker run -d -p 40001:40001 --name image-hosting \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e S3_ACCESS_KEY=your_s3_key \
  -e S3_SECRET_KEY=your_s3_secret \
  s3-image-hosting
```

### 使用Nginx反向代理

创建Nginx配置文件 `/etc/nginx/sites-available/image-hosting`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:40001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/image-hosting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 配置说明

### S3兼容存储服务

本项目支持任何S3兼容的对象存储服务，包括：

- **AWS S3**
- **ClawCloud对象存储**
- **MinIO**
- **DigitalOcean Spaces**
- **阿里云OSS**
- **腾讯云COS**

配置时只需提供相应的访问密钥、端点和其他相关参数。

### 数据库优化

建议在生产环境中对MySQL进行以下优化：

1. 调整`innodb_buffer_pool_size`参数
2. 启用查询缓存
3. 定期执行`OPTIMIZE TABLE`命令
4. 考虑使用读写分离

## 故障排除

### 常见问题

1. **上传失败**
   - 检查S3配置是否正确
   - 确认存储桶权限设置
   - 验证文件大小限制

2. **数据库连接错误**
   - 检查数据库服务是否运行
   - 验证连接参数
   - 确认数据库用户权限

3. **内存不足**
   - 调整Node.js内存限制: `node --max-old-space-size=4096 index.js`
   - 优化数据库查询
   - 考虑使用集群模式

### 日志查看

使用PM2查看日志:
```bash
pm2 logs image-hosting
```

查看应用日志:
```bash
tail -f logs/app.log
```

## 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用ISC许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### v1.0.0
- 初始版本发布
- 基本图片上传和管理功能
- S3存储支持
- API文档

## 支持

如果您遇到任何问题或有任何建议，请提交Issue或联系维护者。

---

**注意**: 在生产环境中，请确保：
- 使用HTTPS协议
- 定期备份数据库
- 监控服务器资源使用情况
- 及时更新依赖包以修复安全漏洞