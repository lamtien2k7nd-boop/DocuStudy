-- Production-ready MySQL schema for study/document platform

CREATE DATABASE IF NOT EXISTS tailieu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tailieu;

-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TAG TYPES (subject, grade, exam)
CREATE TABLE tag_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('subject','grade','exam') NOT NULL UNIQUE
) ENGINE=InnoDB;

-- TAGS
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type_id INT NOT NULL,
  UNIQUE KEY uniq_tag (name, type_id),
  FOREIGN KEY (type_id) REFERENCES tag_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- DOCUMENTS
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  uploaded_by INT,
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- MANY-TO-MANY: DOCUMENT <-> TAG
CREATE TABLE document_tags (
  document_id INT,
  tag_id INT,
  PRIMARY KEY (document_id, tag_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ACCESS LOGS
CREATE TABLE access_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  document_id INT,
  action ENUM('view','download') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- COMMENTS
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  document_id INT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- RATINGS
CREATE TABLE ratings (
  user_id INT,
  document_id INT,
  rating TINYINT CHECK (rating BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, document_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- FAVORITES / BOOKMARKS
CREATE TABLE favorites (
  user_id INT,
  document_id INT,
  PRIMARY KEY (user_id, document_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- INDEXES (important for performance)
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_doc ON access_logs(document_id);
CREATE INDEX idx_comments_doc ON comments(document_id);
CREATE INDEX idx_tags_type ON tags(type_id);
CREATE INDEX idx_doc_tags_tag ON document_tags(tag_id);
CREATE INDEX idx_doc_tags_doc ON document_tags(document_id);
