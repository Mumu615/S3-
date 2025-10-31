const { query } = require('./database');

// 修复中文编码问题
const fixEncoding = (text) => {
  if (!text) return text;
  try {
    // 如果已经是正确的UTF-8编码，直接返回
    if (Buffer.from(text, 'utf8').toString('utf8') === text) {
      return text;
    }
    
    // 尝试从latin1编码转换为utf8
    const latin1ToUtf8 = Buffer.from(text, 'latin1').toString('utf8');
    if (latin1ToUtf8 && !latin1ToUtf8.includes('�')) {
      return latin1ToUtf8;
    }
    
    // 尝试从binary编码转换为utf8
    const binaryToUtf8 = Buffer.from(text, 'binary').toString('utf8');
    if (binaryToUtf8 && !binaryToUtf8.includes('�')) {
      return binaryToUtf8;
    }
    
    // 如果所有转换都失败，返回原始文本
    return text;
  } catch (e) {
    // 如果转换失败，返回原始文本
    return text;
  }
};

// 修复对象中的中文编码
const fixObjectEncoding = (obj) => {
  if (!obj) return obj;
  const fixedObj = { ...obj };
  if (fixedObj.original_name) {
    fixedObj.original_name = fixEncoding(fixedObj.original_name);
  }
  if (fixedObj.filename) {
    fixedObj.filename = fixEncoding(fixedObj.filename);
  }
  return fixedObj;
};

// 修复数组中的中文编码
const fixArrayEncoding = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(item => fixObjectEncoding(item));
};

class ImageModel {
  // 根据哈希查找图片
  static async findByHash(hash) {
    const sql = 'SELECT * FROM images WHERE file_hash = ? AND is_deleted = 0';
    const result = await query(sql, [hash]);
    return result.length > 0 ? fixObjectEncoding(result[0]) : null;
  }

  // 根据ID查找图片
  static async findById(id) {
    const sql = 'SELECT * FROM images WHERE id = ? AND is_deleted = 0';
    const result = await query(sql, [id]);
    return result.length > 0 ? fixObjectEncoding(result[0]) : null;
  }

  // 根据文件名查找图片
  static async findByFilename(filename) {
    const sql = 'SELECT * FROM images WHERE filename = ? AND is_deleted = 0';
    const result = await query(sql, [filename]);
    return result.length > 0 ? fixObjectEncoding(result[0]) : null;
  }

  // 创建新图片记录
  static async create(imageData) {
    const sql = `
      INSERT INTO images (filename, original_name, url, file_hash, file_size, mime_type, base64Data, upload_time, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const { filename, original_name, url, file_hash, file_size, mime_type, base64Data } = imageData;
    const result = await query(sql, [filename, original_name, url, file_hash, file_size, mime_type, base64Data]);
    return result.insertId;
  }

  // 获取图片列表（带分页和筛选）
  static async getList(page = 1, pageSize = 10, month = null, keyword = null) {
    const offset = (page - 1) * pageSize;
    let whereConditions = ['is_deleted = 0'];
    let params = [];

    // 月份筛选
    if (month) {
      whereConditions.push('DATE_FORMAT(upload_time, "%Y-%m") = ?');
      params.push(month);
    }

    // 关键词搜索
    if (keyword) {
      whereConditions.push('(original_name LIKE ? OR filename LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM images WHERE ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // 查询数据 - 使用预处理参数而不是字符串拼接
    const dataSql = `
      SELECT * FROM images 
      WHERE ${whereClause}
      ORDER BY upload_time DESC 
      LIMIT ? OFFSET ?
    `;
    const data = fixArrayEncoding(await query(dataSql, [...params, parseInt(pageSize), parseInt(offset)]));

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // 软删除图片
  static async softDelete(id) {
    const sql = 'UPDATE images SET is_deleted = 1 WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 永久删除图片
  static async hardDelete(id) {
    const sql = 'DELETE FROM images WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 批量软删除
  static async batchSoftDelete(ids) {
    if (!ids || ids.length === 0) return 0;
    
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE images SET is_deleted = 1 WHERE id IN (${placeholders})`;
    const result = await query(sql, ids);
    return result.affectedRows;
  }

  // 批量永久删除
  static async batchHardDelete(ids) {
    if (!ids || ids.length === 0) return 0;
    
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM images WHERE id IN (${placeholders})`;
    const result = await query(sql, ids);
    return result.affectedRows;
  }

  // 获取所有被软删除的图片（用于清理）
  static async getSoftDeleted() {
    const sql = 'SELECT * FROM images WHERE is_deleted = 1';
    return fixArrayEncoding(await query(sql));
  }
}

module.exports = ImageModel;