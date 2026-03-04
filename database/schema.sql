-- ============================================================
--  Document Vault — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS document_vault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE document_vault;

-- ------------------------------------------------------------
-- Users table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120)    NOT NULL,
  email       VARCHAR(180)    NOT NULL UNIQUE,
  password    VARCHAR(255)    NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Documents table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED    NOT NULL,
  file_name    VARCHAR(255)    NOT NULL,
  file_path    VARCHAR(512)    NOT NULL,
  upload_date  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  file_type    VARCHAR(100)    NOT NULL,
  file_size    INT UNSIGNED    NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_documents_user (user_id),
  CONSTRAINT fk_documents_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
