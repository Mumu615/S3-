const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

// 配置内存存储，因为我们需要在内存中处理文件
const storage = multer.memoryStorage({
  filename: function(req, file, cb) {
    // 不在这里处理文件名编码，保留原始文件名
    // 编码转换将在calculateFileHash中间件中处理
    cb(null, file.originalname);
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  // 检查MIME类型
  const allowedMimeTypes = process.env.ALLOWED_MIME_TYPES.split(',');
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。只允许: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// 配置multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
    files: 1 // 每次只允许上传一个文件
  }
});

// 单文件上传中间件
const uploadSingle = upload.single('image');

// 处理上传错误的中间件
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制',
        maxSize: process.env.MAX_FILE_SIZE
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段'
      });
    }
  }
  
  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // 其他错误
  return res.status(500).json({
    success: false,
    message: '文件上传处理失败',
    error: error.message
  });
};

// 计算文件哈希的中间件
const calculateFileHash = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '没有上传文件'
    });
  }
  
  try {
    // 计算文件的SHA256哈希
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    req.fileHash = hash;
    
    // 获取前端发送的编码方法和原始文件名
    const encodingMethod = req.body.encodingMethod || 'unknown';
    const originalFilename = req.body.originalFilename || req.file.originalname;
    
    // 尝试修复文件名编码
    const originalname = req.file.originalname;
    console.log('原始文件名:', originalname);
    console.log('前端编码方法:', encodingMethod);
    console.log('前端原始文件名:', originalFilename);
    
    // 如果前端使用了latin1编码，我们需要进行相应的解码
    let fixedName = originalname;
    
    if (encodingMethod === 'latin1') {
      // 前端使用了latin1编码，我们需要从latin1转换为utf8
      try {
        fixedName = Buffer.from(originalname, 'latin1').toString('utf8');
        console.log('latin1解码结果:', fixedName);
      } catch (e) {
        console.log('latin1解码失败，尝试其他方法:', e.message);
        
        // 如果latin1解码失败，尝试其他编码方法
        // 方法1: 尝试URL解码（处理encodeURIComponent编码的文件名）
        try {
          fixedName = decodeURIComponent(originalname);
          console.log('URL解码结果:', fixedName);
        } catch (e) {
          console.log('URL解码失败:', e.message);
        }
        
        // 方法2: 尝试从binary编码转换为utf8
        if (fixedName === originalname) {
          try {
            fixedName = Buffer.from(originalname, 'binary').toString('utf8');
            console.log('binary转utf8结果:', fixedName);
          } catch (e) {
            console.log('binary转utf8失败:', e.message);
          }
        }
      }
    } else {
      // 前端使用了UTF-8编码，尝试多种解码方法
      // 方法1: 尝试URL解码（处理encodeURIComponent编码的文件名）
      try {
        fixedName = decodeURIComponent(originalname);
        console.log('URL解码结果:', fixedName);
      } catch (e) {
        console.log('URL解码失败:', e.message);
      }
      
      // 方法2: 尝试从binary编码转换为utf8
      if (fixedName === originalname) {
        try {
          fixedName = Buffer.from(originalname, 'binary').toString('utf8');
          console.log('binary转utf8结果:', fixedName);
        } catch (e) {
          console.log('binary转utf8失败:', e.message);
        }
      }
      
      // 方法3: 尝试从latin1编码转换为utf8
      if (fixedName === originalname) {
        try {
          fixedName = Buffer.from(originalname, 'latin1').toString('utf8');
          console.log('latin1转utf8结果:', fixedName);
        } catch (e) {
          console.log('latin1转utf8失败:', e.message);
        }
      }
      
      // 方法4: 尝试从utf8转换为binary再转回utf8
      if (fixedName === originalname) {
        try {
          fixedName = Buffer.from(Buffer.from(originalname, 'utf8').toString('binary'), 'binary').toString('utf8');
          console.log('utf8->binary->utf8结果:', fixedName);
        } catch (e) {
          console.log('utf8->binary->utf8失败:', e.message);
        }
      }
      
      // 方法5: 尝试从hex转换为utf8
      if (fixedName === originalname) {
        try {
          // 检查是否是有效的十六进制字符串
          if (/^[0-9a-fA-F]+$/.test(originalname)) {
            fixedName = Buffer.from(originalname, 'hex').toString('utf8');
            console.log('hex转utf8结果:', fixedName);
          }
        } catch (e) {
          console.log('hex转utf8失败:', e.message);
        }
      }
      
      // 方法6: 尝试从base64转换为utf8
      if (fixedName === originalname) {
        try {
          // 检查是否是有效的base64字符串
          if (/^[A-Za-z0-9+/]*={0,2}$/.test(originalname)) {
            fixedName = Buffer.from(originalname, 'base64').toString('utf8');
            console.log('base64转utf8结果:', fixedName);
          }
        } catch (e) {
          console.log('base64转utf8失败:', e.message);
        }
      }
    }
    
    // 如果所有解码方法都失败，使用前端发送的原始文件名
    if (fixedName === originalname && originalFilename !== originalname) {
      fixedName = originalFilename;
      console.log('使用前端原始文件名:', fixedName);
    }
    
    req.file.originalname = fixedName;
    console.log('最终文件名:', req.file.originalname);
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '计算文件哈希失败',
      error: error.message
    });
  }
};

module.exports = {
  uploadSingle,
  handleUploadError,
  calculateFileHash
};