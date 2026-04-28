-- create_db.sql
-- Run in MySQL (phpMyAdmin or mysql client):
-- CREATE DATABASE abs_project_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE abs_project_manager;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  due_date DATE,
  priority INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'todo',
  tags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- After importing this file, run `php api/seed.php` to insert sample users and projects (it uses password_hash).
