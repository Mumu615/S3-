const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '图片托管服务API',
      version: '1.0.0',
      description: '基于Node.js + Express + MySQL的S3图床服务API文档，支持图片上传、管理、批量删除等功能。',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:40001',
        description: '开发服务器'
      }
    ],
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            error: {
              type: 'string',
              description: '错误信息（仅在失败时提供）'
            }
          }
        },
        ImageInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '图片ID'
            },
            filename: {
              type: 'string',
              description: '存储文件名'
            },
            originalName: {
              type: 'string',
              description: '原始文件名'
            },
            url: {
              type: 'string',
              description: '图片访问URL'
            },
            fileSize: {
              type: 'integer',
              description: '文件大小（字节）'
            },
            mimeType: {
              type: 'string',
              description: 'MIME类型'
            },
            uploadTime: {
              type: 'string',
              format: 'date-time',
              description: '上传时间'
            },
            isDuplicate: {
              type: 'boolean',
              description: '是否为重复文件'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: '当前页码'
            },
            pageSize: {
              type: 'integer',
              description: '每页数量'
            },
            total: {
              type: 'integer',
              description: '总记录数'
            },
            totalPages: {
              type: 'integer',
              description: '总页数'
            }
          }
        },
        ImageListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ImageInfo'
              },
              description: '图片列表'
            },
            pagination: {
              $ref: '#/components/schemas/Pagination'
            }
          }
        },
        BatchDeleteResult: {
          type: 'object',
          properties: {
            requested: {
              type: 'integer',
              description: '请求删除的数量'
            },
            found: {
              type: 'integer',
              description: '找到的数量'
            },
            deleted: {
              type: 'integer',
              description: '实际删除的数量'
            },
            notFound: {
              type: 'integer',
              description: '未找到的数量'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: '错误消息'
            },
            error: {
              type: 'string',
              description: '详细错误信息'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // 指向包含Swagger注释的文件
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};