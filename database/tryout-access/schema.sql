CREATE TABLE IF NOT EXISTS tryout_access_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  token_scope ENUM('gratis', 'berbayar', 'all') NOT NULL DEFAULT 'berbayar',
  status ENUM('active', 'disabled', 'expired', 'depleted') NOT NULL DEFAULT 'active',
  usage_limit INT UNSIGNED NOT NULL DEFAULT 1,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  expires_at DATETIME NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_tryout_access_tokens_code (code),
  KEY idx_tryout_access_tokens_scope (token_scope),
  KEY idx_tryout_access_tokens_status (status),
  KEY idx_tryout_access_tokens_expires_at (expires_at),
  CONSTRAINT fk_tryout_access_tokens_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tryout_access_grants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tier ENUM('gratis', 'berbayar') NOT NULL,
  tryout_slug VARCHAR(191) NOT NULL,
  token_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_tryout_access_grants_user_tryout (user_id, tier, tryout_slug),
  KEY idx_tryout_access_grants_tryout (tier, tryout_slug),
  CONSTRAINT fk_tryout_access_grants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_tryout_access_grants_token FOREIGN KEY (token_id) REFERENCES tryout_access_tokens (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
