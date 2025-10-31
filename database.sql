-- 优化后的图片存储表结构
CREATE TABLE `images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `file_hash` varchar(64) NOT NULL,
  `file_size` bigint NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `upload_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `base64Data` text COMMENT '存储文件的base64编码数据或缩略图',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_filename` (`filename`),
  KEY `idx_hash` (`file_hash`),
  KEY `idx_upload_time` (`upload_time`),
  KEY `idx_is_deleted` (`is_deleted`),
  KEY `idx_original_name` (`original_name`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;