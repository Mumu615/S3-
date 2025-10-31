# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --only=production

# 复制应用源代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# 暴露端口
EXPOSE 40001

# 定义环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "start"]