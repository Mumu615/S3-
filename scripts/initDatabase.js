const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

// 创建数据库和表的SQL语句
const createDatabaseSQL = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`;
const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.images (
  id int NOT NULL AUTO_INCREMENT,
  filename varchar(255) NOT NULL,
  original_name varchar(255) NOT NULL,
  url varchar(500) NOT NULL,
  file_hash varchar(64) NOT NULL,
  file_size bigint NOT NULL,
  mime_type varchar(100) NOT NULL,
  upload_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted tinyint(1) NOT NULL DEFAULT '0',
  base64Data LONGTEXT COMMENT '存储文件的base64编码数据或缩略图',
  PRIMARY KEY (id),
  UNIQUE KEY unique_filename (filename),
  KEY idx_hash (file_hash),
  KEY idx_upload_time (upload_time),
  KEY idx_is_deleted (is_deleted),
  KEY idx_original_name (original_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
`;

async function initDatabase() {
  let connection;
  
  try {
    // 连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection(connectionConfig);
    console.log('已连接到MySQL服务器');
    
    // 创建数据库
    await connection.execute(createDatabaseSQL);
    console.log(`数据库 ${process.env.DB_NAME} 创建成功或已存在`);
    
    // 创建表
    await connection.execute(createTableSQL);
    console.log('images表创建成功或已存在');
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行初始化
initDatabase();