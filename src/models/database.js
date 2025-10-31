const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
}

// 执行查询
async function query(sql, params = []) {
  try {
    console.log('执行SQL:', sql);
    console.log('参数:', params);
    const [rows] = await pool.query(sql, params);
    
    // 检查结果是否需要编码修复
    if (rows && Array.isArray(rows) && rows.length > 0) {
      // 检查第一行是否包含可能需要修复的字段
      const firstRow = rows[0];
      if (firstRow.original_name || firstRow.filename) {
        // 如果包含中文可能乱码的字符，尝试修复
        const hasPotentialEncodingIssues = Object.values(firstRow).some(value => 
          typeof value === 'string' && value.includes('�')
        );
        
        if (hasPotentialEncodingIssues) {
          console.log('检测到可能的编码问题，尝试修复...');
          // 这里我们不直接修改，让ImageModel的fixArrayEncoding处理
        }
      }
    }
    
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    console.error('SQL:', sql);
    console.error('参数:', params);
    throw error;
  }
}

// 执行事务
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};