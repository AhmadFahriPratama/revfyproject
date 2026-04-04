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
