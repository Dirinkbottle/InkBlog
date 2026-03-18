-- ============================================================
-- InkBlog 数据库初始化脚本 (MySQL)
-- 幂等设计：可重复执行，不会破坏已有数据
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id`                             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at`                     DATETIME(3) NULL,
  `updated_at`                     DATETIME(3) NULL,
  `deleted_at`                     DATETIME(3) NULL,
  `username`                       VARCHAR(50) NOT NULL,
  `email`                          VARCHAR(100) NOT NULL,
  `password`                       VARCHAR(255) NOT NULL,
  `avatar_base64`                  LONGTEXT,
  `display_name`                   VARCHAR(100) DEFAULT '',
  `bio`                            TEXT,
  `role`                           VARCHAR(20) NOT NULL DEFAULT 'user',
  `status`                         VARCHAR(20) NOT NULL DEFAULT 'active',
  `permissions`                    JSON,
  `is_email_verified`              TINYINT(1) DEFAULT 0,
  `email_verification_token`       VARCHAR(255) DEFAULT '',
  `email_verification_sent_at`     DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_users_deleted_at` (`deleted_at`),
  UNIQUE INDEX `idx_users_username` (`username`),
  UNIQUE INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at`  DATETIME(3) NULL,
  `updated_at`  DATETIME(3) NULL,
  `deleted_at`  DATETIME(3) NULL,
  `name`        VARCHAR(100) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `description` TEXT,
  `parent_id`   BIGINT UNSIGNED NULL,
  `sort_order`  INT DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_categories_deleted_at` (`deleted_at`),
  UNIQUE INDEX `idx_categories_name` (`name`),
  UNIQUE INDEX `idx_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NULL,
  `deleted_at` DATETIME(3) NULL,
  `name`       VARCHAR(50) NOT NULL,
  `slug`       VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_tags_deleted_at` (`deleted_at`),
  UNIQUE INDEX `idx_tags_name` (`name`),
  UNIQUE INDEX `idx_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posts` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at`   DATETIME(3) NULL,
  `updated_at`   DATETIME(3) NULL,
  `deleted_at`   DATETIME(3) NULL,
  `title`        VARCHAR(255) NOT NULL,
  `slug`         VARCHAR(255) NOT NULL,
  `content`      TEXT NOT NULL,
  `summary`      TEXT,
  `cover_image`  VARCHAR(500) DEFAULT '',
  `author_id`    BIGINT UNSIGNED NOT NULL,
  `category_id`  BIGINT UNSIGNED NULL,
  `status`       VARCHAR(20) NOT NULL DEFAULT 'draft',
  `views`        INT DEFAULT 0,
  `likes`        INT DEFAULT 0,
  `published_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_posts_deleted_at` (`deleted_at`),
  INDEX `idx_posts_author_id` (`author_id`),
  INDEX `idx_posts_category_id` (`category_id`),
  UNIQUE INDEX `idx_posts_slug` (`slug`),
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `post_tags` (
  `post_id` BIGINT UNSIGNED NOT NULL,
  `tag_id`  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  CONSTRAINT `fk_post_tags_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `fk_post_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comments` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NULL,
  `deleted_at` DATETIME(3) NULL,
  `post_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`    BIGINT UNSIGNED NULL,
  `parent_id`  BIGINT UNSIGNED NULL,
  `content`    TEXT NOT NULL,
  `status`     VARCHAR(20) NOT NULL DEFAULT 'pending',
  `ip`         VARCHAR(45) DEFAULT '',
  `user_agent` VARCHAR(500) DEFAULT '',
  PRIMARY KEY (`id`),
  INDEX `idx_comments_deleted_at` (`deleted_at`),
  INDEX `idx_comments_post_id` (`post_id`),
  INDEX `idx_comments_user_id` (`user_id`),
  INDEX `idx_comments_parent_id` (`parent_id`),
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL,
  `updated_at` DATETIME(3) NULL,
  `value`      TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attachments` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME(3) NULL,
  `deleted_at` DATETIME(3) NULL,
  `post_id`    BIGINT UNSIGNED NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `file_name`  VARCHAR(255) NOT NULL,
  `file_url`   VARCHAR(500) NOT NULL,
  `file_size`  BIGINT NOT NULL DEFAULT 0,
  `file_type`  VARCHAR(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  INDEX `idx_attachments_deleted_at` (`deleted_at`),
  INDEX `idx_attachments_post_id` (`post_id`),
  INDEX `idx_attachments_user_id` (`user_id`),
  CONSTRAINT `fk_attachments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `fk_attachments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 默认数据（INSERT IGNORE：唯一键冲突时跳过，不覆盖已有数据）
-- ============================================================

INSERT IGNORE INTO `categories` (`name`, `slug`, `description`, `created_at`, `updated_at`)
VALUES
  ('未分类', 'uncategorized', '默认分类', NOW(), NOW()),
  ('技术', 'tech', '技术相关文章', NOW(), NOW()),
  ('生活', 'life', '生活随笔', NOW(), NOW());

INSERT IGNORE INTO `tags` (`name`, `slug`, `created_at`, `updated_at`)
VALUES
  ('随笔', 'essay', NOW(), NOW()),
  ('教程', 'tutorial', NOW(), NOW()),
  ('笔记', 'note', NOW(), NOW());

INSERT IGNORE INTO `settings` (`id`, `value`, `created_at`, `updated_at`)
VALUES (1, '{"site_name":"InkBlog","site_subtitle":"一个简洁的博客系统","site_description":"InkBlog 是一个使用 Go 和 React 构建的现代博客系统","site_keywords":"博客,Blog,InkBlog","site_purpose":"记录技术成长，分享开发经验","footer_text":"© 2025 InkBlog. All rights reserved.","icp_number":"","seo_title":"InkBlog - 简洁的博客系统","seo_description":"InkBlog 是一个使用 Go 和 React 构建的现代博客系统","seo_keywords":"博客,Blog,InkBlog,Go,React","social_github":"","social_twitter":"","social_email":"","social_wechat":"","comment_auto_approve":"true","comment_require_moderation":"false","hero_title":"探索数字前沿","hero_description":"这里记录着全栈开发的旅程，分享 Web 技术、架构设计和创新实践","email_verification_enabled":"true","email_verification_expiry_hours":"24","email_verification_base_url":"https://dirinkbottle.asia","email_smtp_host":"","email_smtp_port":"587","email_smtp_username":"","email_smtp_password":"","email_from_address":"","email_from_name":"InkBlog","email_library":"gomail"}', NOW(), NOW());