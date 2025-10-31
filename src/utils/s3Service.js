const AWS = require('aws-sdk');
const crypto = require('crypto');
require('dotenv').config();

// 配置S3客户端
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  s3ForcePathStyle: true, // 必须设置为true以使用自定义endpoint
  signatureVersion: 'v4'
});

// 获取Bucket名称
const bucketName = process.env.S3_BUCKET;

// 生成唯一文件名
function generateUniqueFilename(originalName, fileHash) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // 获取文件扩展名
  const ext = originalName.split('.').pop();
  
  // 生成唯一文件名：年/月/哈希前8位_时间戳.扩展名
  const hashPrefix = fileHash.substring(0, 8);
  const timestamp = `${hours}${minutes}${seconds}`;
  
  return `${year}/${month}/${hashPrefix}_${timestamp}.${ext}`;
}

// 计算文件哈希值
function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// 上传文件到S3
async function uploadFile(buffer, filename, mimeType) {
  const params = {
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read' // 设置为公开读取
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; // 返回公开访问URL
  } catch (error) {
    console.error('S3上传失败:', error);
    throw error;
  }
}

// 从S3删除文件
async function deleteFile(filename) {
  const params = {
    Bucket: bucketName,
    Key: filename
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3删除失败:', error);
    throw error;
  }
}

// 批量删除S3文件
async function batchDeleteFiles(filenames) {
  if (!filenames || filenames.length === 0) return { success: 0, failed: 0 };

  const deleteParams = {
    Bucket: bucketName,
    Delete: {
      Objects: filenames.map(filename => ({ Key: filename }))
    }
  };

  try {
    const result = await s3.deleteObjects(deleteParams).promise();
    return {
      success: result.Deleted ? result.Deleted.length : 0,
      failed: result.Errors ? result.Errors.length : 0,
      errors: result.Errors || []
    };
  } catch (error) {
    console.error('S3批量删除失败:', error);
    throw error;
  }
}

// 检查S3中是否存在文件
async function fileExists(filename) {
  const params = {
    Bucket: bucketName,
    Key: filename
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// 获取文件元数据
async function getFileMetadata(filename) {
  const params = {
    Bucket: bucketName,
    Key: filename
  };

  try {
    const result = await s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      etag: result.ETag
    };
  } catch (error) {
    console.error('获取S3文件元数据失败:', error);
    throw error;
  }
}

module.exports = {
  s3,
  bucketName,
  generateUniqueFilename,
  calculateHash,
  uploadFile,
  deleteFile,
  batchDeleteFiles,
  fileExists,
  getFileMetadata
};