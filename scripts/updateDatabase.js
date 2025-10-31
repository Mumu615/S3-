const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function updateDatabase() {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection(connectionConfig);
    console.log('已连接到数据库');
    
    // 修改base64Data字段类型为LONGTEXT
    const alterTableSQL = `
      ALTER TABLE images 
      MODIFY COLUMN base64Data LONGTEXT COMMENT '存储文件的base64编码数据或缩略图'
    `;
    
    await connection.execute(alterTableSQL);
    console.log('base64Data字段类型已更新为LONGTEXT');
    
    console.log('数据库更新完成');
  } catch (error) {
    console.error('数据库更新失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行更新
updateDatabase();