CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  display_name VARCHAR(128) NOT NULL,
  focus VARCHAR(191) NOT NULL DEFAULT 'General Focus',
  plan ENUM('free', 'pro', 'elite') NOT NULL DEFAULT 'free',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token VARCHAR(128) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_sessions_token (session_token),
  KEY idx_user_sessions_user_id (user_id),
  KEY idx_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan ENUM('free', 'pro', 'elite') NOT NULL,
  status ENUM('active', 'inactive', 'expired') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_subscriptions_user_id (user_id),
  KEY idx_subscriptions_status (status),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redeem_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  plan ENUM('free', 'pro', 'elite') NOT NULL,
  status ENUM('active', 'redeemed', 'disabled', 'expired') NOT NULL DEFAULT 'active',
  usage_limit INT UNSIGNED NOT NULL DEFAULT 1,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  redeemed_by_user_id BIGINT UNSIGNED NULL,
  redeemed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_redeem_codes_code (code),
  KEY idx_redeem_codes_status (status),
  KEY idx_redeem_codes_plan (plan),
  KEY idx_redeem_codes_expires_at (expires_at),
  CONSTRAINT fk_redeem_codes_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_redeem_codes_redeemed_by FOREIGN KEY (redeemed_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_subjects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(64) NOT NULL,
  level_label VARCHAR(191) NULL,
  name VARCHAR(191) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description LONGTEXT NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_content_subjects_slug (slug),
  KEY idx_content_subjects_category (category),
  KEY idx_content_subjects_level (level_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id BIGINT UNSIGNED NULL,
  source_id VARCHAR(191) NULL,
  source_path VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  level_label VARCHAR(191) NULL,
  slug VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary LONGTEXT NULL,
  description LONGTEXT NULL,
  tags_json LONGTEXT NULL,
  section_count INT NOT NULL DEFAULT 0,
  item_count INT NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_materials_slug (slug),
  UNIQUE KEY uniq_materials_source_path (source_path),
  KEY idx_materials_subject_id (subject_id),
  KEY idx_materials_category (category),
  KEY idx_materials_level (level_label),
  CONSTRAINT fk_materials_subject FOREIGN KEY (subject_id) REFERENCES content_subjects (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS material_sections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  material_id BIGINT UNSIGNED NOT NULL,
  section_order INT NOT NULL DEFAULT 0,
  title VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_material_sections_material_id (material_id),
  KEY idx_material_sections_order (section_order),
  CONSTRAINT fk_material_sections_material FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_sets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id BIGINT UNSIGNED NULL,
  source_kind ENUM('practice', 'tryout') NOT NULL,
  source_id VARCHAR(191) NULL,
  source_path VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  level_label VARCHAR(191) NULL,
  slug VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  focus VARCHAR(191) NULL,
  mode VARCHAR(64) NULL,
  description LONGTEXT NULL,
  item_count INT NOT NULL DEFAULT 0,
  duration_minutes INT NULL,
  tags_json LONGTEXT NULL,
  metadata_json LONGTEXT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_question_sets_slug (slug),
  UNIQUE KEY uniq_question_sets_source_path (source_path),
  KEY idx_question_sets_subject_id (subject_id),
  KEY idx_question_sets_category (category),
  KEY idx_question_sets_level (level_label),
  KEY idx_question_sets_source_kind (source_kind),
  CONSTRAINT fk_question_sets_subject FOREIGN KEY (subject_id) REFERENCES content_subjects (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  set_id BIGINT UNSIGNED NOT NULL,
  source_question_id VARCHAR(191) NULL,
  question_order INT NOT NULL DEFAULT 0,
  question_text LONGTEXT NOT NULL,
  answer_key VARCHAR(32) NOT NULL,
  explanation LONGTEXT NULL,
  tip LONGTEXT NULL,
  topic VARCHAR(191) NULL,
  difficulty VARCHAR(64) NULL,
  level_label VARCHAR(191) NULL,
  metadata_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_questions_set_id (set_id),
  KEY idx_questions_topic (topic),
  KEY idx_questions_difficulty (difficulty),
  KEY idx_questions_order (question_order),
  CONSTRAINT fk_questions_set FOREIGN KEY (set_id) REFERENCES question_sets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  option_key VARCHAR(8) NOT NULL,
  option_text LONGTEXT NOT NULL,
  option_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_question_option (question_id, option_key),
  KEY idx_question_options_question_id (question_id),
  CONSTRAINT fk_question_options_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(191) NOT NULL,
  label VARCHAR(191) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_question_tags_slug (slug),
  KEY idx_question_tags_label (label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_tag_map (
  question_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id, tag_id),
  KEY idx_question_tag_map_tag_id (tag_id),
  CONSTRAINT fk_question_tag_map_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT fk_question_tag_map_tag FOREIGN KEY (tag_id) REFERENCES question_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  tier ENUM('gratis', 'berbayar') NOT NULL,
  tryout_slug VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  focus VARCHAR(191) NOT NULL,
  current_index INT NOT NULL DEFAULT 0,
  remaining_seconds INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  answers_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_user_progress (username, tier, tryout_slug),
  KEY idx_user_progress_username (username),
  KEY idx_user_progress_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  tryout_slug VARCHAR(191) NOT NULL,
  tier ENUM('gratis', 'berbayar') NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  focus VARCHAR(191) NOT NULL,
  correct_count INT NOT NULL DEFAULT 0,
  answered_count INT NOT NULL DEFAULT 0,
  total_count INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  accuracy INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  topic_breakdown_json LONGTEXT NOT NULL,
  completed_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_attempts_username (username),
  KEY idx_user_attempts_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
