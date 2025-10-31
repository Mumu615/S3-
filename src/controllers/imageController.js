const ImageModel = require('../models/ImageModel');
const { generateUniqueFilename, uploadFile } = require('../utils/s3Service');

class ImageController {
  // 修复中文编码问题
  static fixEncoding(text) {
    if (!text) return text;
    try {
      // 尝试从latin1编码转换为utf8
      return Buffer.from(text, 'latin1').toString('utf8');
    } catch (e) {
      // 如果转换失败，返回原始文本
      return text;
    }
  }

  // 上传图片
  static async uploadImage(req, res) {
    try {
      const { originalname, mimetype, size, buffer } = req.file;
      const fileHash = req.fileHash;
      
      // 获取前端发送的编码方法和原始文件名
      const encodingMethod = req.body.encodingMethod || 'unknown';
      const originalFilename = req.body.originalFilename || originalname;
      
      console.log('控制器 - 原始文件名:', originalname);
      console.log('控制器 - 前端编码方法:', encodingMethod);
      console.log('控制器 - 前端原始文件名:', originalFilename);

      // 使用中间件已经处理过的文件名，不需要再次处理
      // 因为中间件已经根据前端发送的编码信息进行了正确的解码
      const processedOriginalName = originalname;
      console.log('控制器 - 最终文件名:', processedOriginalName);

      // 检查是否已存在相同哈希的文件
      const existingImage = await ImageModel.findByHash(fileHash);
      if (existingImage) {
        return res.status(200).json({
          success: true,
          message: '文件已存在，返回已有URL',
          data: {
            id: existingImage.id,
            filename: existingImage.filename,
            originalName: processedOriginalName,
            url: existingImage.url,
            fileSize: existingImage.file_size,
            mimeType: existingImage.mime_type,
            uploadTime: existingImage.upload_time,
            isDuplicate: true,
            base64: existingImage.base64Data
          }
        });
      }

      // 生成唯一文件名
      const filename = generateUniqueFilename(processedOriginalName, fileHash);

      // 上传到S3
      const url = await uploadFile(buffer, filename, mimetype);

      // 生成缩略图（这里简化处理，实际可以使用sharp等库生成）
      let base64Data = null;
      if (size < 1024 * 1024) { // 小于1MB的文件存储base64缩略图
        base64Data = `data:${mimetype};base64,${buffer.toString('base64')}`;
      }

      // 保存到数据库
      const imageId = await ImageModel.create({
        filename,
        original_name: processedOriginalName,
        url,
        file_hash: fileHash,
        file_size: size,
        mime_type: mimetype,
        base64Data
      });

      // 返回结果
      res.status(201).json({
        success: true,
        message: '图片上传成功',
        data: {
          id: imageId,
          filename,
          originalName: processedOriginalName,
          url,
          fileSize: size,
          mimeType: mimetype,
          uploadTime: new Date(),
          isDuplicate: false,
          base64: base64Data
        }
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      res.status(500).json({
        success: false,
        message: '上传图片失败',
        error: error.message
      });
    }
  }

  // 获取图片列表
  static async getImageList(req, res) {
    try {
      const { page = 1, pageSize = 10, month, keyword } = req.query;
      
      // 转换为数字
      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      
      // 验证参数
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: '页码必须是大于0的整数'
        });
      }
      
      if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
        return res.status(400).json({
          success: false,
          message: '每页数量必须是1-100之间的整数'
        });
      }

      // 获取图片列表
      const result = await ImageModel.getList(pageNum, pageSizeNum, month, keyword);
      
      res.status(200).json({
        success: true,
        message: '获取图片列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取图片列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取图片列表失败',
        error: error.message
      });
    }
  }

  // 删除图片
  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '缺少图片ID'
        });
      }

      // 查找图片
      const image = await ImageModel.findById(id);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: '图片不存在或已被删除'
        });
      }

      // 软删除
      await ImageModel.softDelete(id);
      
      res.status(200).json({
        success: true,
        message: '图片删除成功'
      });
    } catch (error) {
      console.error('删除图片失败:', error);
      res.status(500).json({
        success: false,
        message: '删除图片失败',
        error: error.message
      });
    }
  }

  // 根据哈希查询图片
  static async getImageByHash(req, res) {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({
          success: false,
          message: '缺少文件哈希值'
        });
      }

      // 查找图片
      const image = await ImageModel.findByHash(hash);
      if (!image) {
        return res.status(404).json({
          success: false,
          message: '未找到匹配的图片'
        });
      }
      
      res.status(200).json({
        success: true,
        message: '查询成功',
        data: image
      });
    } catch (error) {
      console.error('根据哈希查询图片失败:', error);
      res.status(500).json({
        success: false,
        message: '根据哈希查询图片失败',
        error: error.message
      });
    }
  }

  // 批量删除图片
  static async batchDeleteImages(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的图片ID列表'
        });
      }

      // 验证所有ID是否存在
      const existingImages = [];
      for (const id of ids) {
        const image = await ImageModel.findById(id);
        if (image) {
          existingImages.push(id);
        }
      }

      if (existingImages.length === 0) {
        return res.status(404).json({
          success: false,
          message: '没有找到可删除的图片'
        });
      }

      // 批量软删除
      const deletedCount = await ImageModel.batchSoftDelete(existingImages);
      
      res.status(200).json({
        success: true,
        message: `成功删除 ${deletedCount} 张图片`,
        data: {
          requested: ids.length,
          found: existingImages.length,
          deleted: deletedCount,
          notFound: ids.length - existingImages.length
        }
      });
    } catch (error) {
      console.error('批量删除图片失败:', error);
      res.status(500).json({
        success: false,
        message: '批量删除图片失败',
        error: error.message
      });
    }
  }
}

module.exports = ImageController;