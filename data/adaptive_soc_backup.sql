-- Adaptive SOC Database Backup
SET FOREIGN_KEY_CHECKS=0;

-- Table structure for `accounts`
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `host_id` int NOT NULL,
  `is_privileged` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_accounts_host` (`host_id`),
  CONSTRAINT `fk_accounts_host` FOREIGN KEY (`host_id`) REFERENCES `hosts` (`host_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `accounts`
INSERT INTO `accounts` (`account_id`, `username`, `full_name`, `host_id`, `is_privileged`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'admin', 'Administrator', 1, 1, 1, '2026-09-01 16:52:07', '2026-09-01 16:52:07');
INSERT INTO `accounts` (`account_id`, `username`, `full_name`, `host_id`, `is_privileged`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'john', 'John Doe', 1, 0, 1, '2026-09-01 16:52:07', '2026-09-01 16:52:07');
INSERT INTO `accounts` (`account_id`, `username`, `full_name`, `host_id`, `is_privileged`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'alice', 'Alice Smith', 1, 0, 1, '2026-09-01 16:52:07', '2026-09-01 16:52:07');

-- Table structure for `audit_logs`
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint DEFAULT NULL,
  `event_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actor` varchar(100) NOT NULL DEFAULT 'SYSTEM',
  `action` varchar(100) NOT NULL,
  `action_result` enum('SUCCESS','FAILED','INFO') NOT NULL DEFAULT 'SUCCESS',
  `details` text,
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_time` (`event_time`),
  KEY `idx_audit_action` (`action`),
  KEY `fk_audit_incident` (`incident_id`),
  CONSTRAINT `fk_audit_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`incident_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `audit_logs`
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (1, 1, '2026-09-17 15:55:57', 'SYSTEM', 'BRUTE_FORCE_RESPONSE', 'SUCCESS', 'Detected brute-force attack from 192.168.1.50. Risk score: 85. Risk level: HIGH. BLOCK_IP response recorded.');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (2, 2, '2026-09-17 16:00:59', 'SYSTEM', 'BRUTE_FORCE_RESPONSE', 'SUCCESS', 'Detected brute-force attack from 192.168.1.51. Risk score: 85. Risk level: HIGH. BLOCK_IP response recorded.');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (3, NULL, '2026-09-22 00:13:21', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Manual firewall block for 192.168.1.52. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (4, 3, '2026-09-22 00:19:31', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (5, 4, '2026-09-22 00:19:33', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (6, 5, '2026-09-22 00:20:07', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (7, 6, '2026-09-22 00:20:15', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (8, 7, '2026-09-22 00:20:22', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (9, 8, '2026-09-22 00:20:31', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (10, 9, '2026-09-22 00:20:38', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Attempted Windows Firewall block for 192.168.1.53. Result: SUCCESS');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (11, 10, '2026-09-22 00:42:26', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Windows Firewall block requested for 192.168.1.54. Firewall command result: SUCCESS. Rule verification result: UNKNOWN.');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (12, 11, '2026-09-22 00:52:52', 'SYSTEM', 'BLOCK_IP', 'SUCCESS', 'Windows Firewall block requested for 192.168.1.55. Firewall command result: SUCCESS. Rule verification result: UNKNOWN.');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (13, 12, '2026-09-22 01:08:31', 'SYSTEM', 'AUTOMATIC_BLOCK_IP', 'SUCCESS', 'Automatic brute-force response executed for 192.168.1.56. Firewall result: SUCCESS. Verification: STOPPED.');
INSERT INTO `audit_logs` (`audit_id`, `incident_id`, `event_time`, `actor`, `action`, `action_result`, `details`) VALUES (14, 13, '2026-09-22 01:37:29', 'SYSTEM', 'AUTOMATIC_BLOCK_IP', 'SUCCESS', 'Automatic brute-force response executed for 192.168.1.60. Firewall result: SUCCESS. Verification: STOPPED.');

-- Table structure for `detections`
DROP TABLE IF EXISTS `detections`;
CREATE TABLE `detections` (
  `detection_id` bigint NOT NULL AUTO_INCREMENT,
  `event_id` bigint NOT NULL,
  `host_id` int NOT NULL,
  `account_id` int DEFAULT NULL,
  `detection_time` datetime NOT NULL,
  `detection_type` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `status` enum('NEW','ANALYZING','CONFIRMED','CLOSED') NOT NULL DEFAULT 'NEW',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`detection_id`),
  KEY `idx_detections_time` (`detection_time`),
  KEY `idx_detections_type` (`detection_type`),
  KEY `fk_detections_event` (`event_id`),
  KEY `fk_detections_host` (`host_id`),
  KEY `fk_detections_account` (`account_id`),
  CONSTRAINT `fk_detections_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_detections_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`),
  CONSTRAINT `fk_detections_host` FOREIGN KEY (`host_id`) REFERENCES `hosts` (`host_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `detections`
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (1, 5, 1, 1, '2026-09-01 16:54:48', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.50 within the last minute.', 'CONFIRMED', '2026-09-01 16:54:47');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (2, 10, 1, 1, '2026-09-17 15:55:57', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.50 within the last minute.', 'CONFIRMED', '2026-09-17 15:55:57');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (3, 15, 1, 1, '2026-09-17 16:00:59', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.51 within the last minute.', 'CONFIRMED', '2026-09-17 16:00:59');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (4, 20, 1, 1, '2026-09-22 00:19:30', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:19:30');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (5, 21, 1, 1, '2026-09-22 00:19:33', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 6 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:19:33');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (6, 22, 1, 1, '2026-09-22 00:20:07', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 7 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:20:07');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (7, 23, 1, 1, '2026-09-22 00:20:15', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 7 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:20:14');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (8, 24, 1, 1, '2026-09-22 00:20:22', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 7 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:20:22');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (9, 25, 1, 1, '2026-09-22 00:20:31', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 6 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:20:30');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (10, 26, 1, 1, '2026-09-22 00:20:38', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.53 within the last minute.', 'CONFIRMED', '2026-09-22 00:20:38');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (11, 37, 1, 1, '2026-09-22 00:42:26', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.54 within the last minute.', 'CONFIRMED', '2026-09-22 00:42:25');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (12, 42, 1, 1, '2026-09-22 00:52:52', 'BRUTE_FORCE', 'Brute-Force Attack Detected', 'Detected 5 failed login attempts from source IP 192.168.1.55 within the last minute.', 'CONFIRMED', '2026-09-22 00:52:52');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (13, 47, 1, 1, '2026-09-22 01:08:31', 'BRUTE_FORCE', 'Brute-Force Attack Detected', '5 failed login attempts from source IP 192.168.1.56 within the last minute.', 'CONFIRMED', '2026-09-22 01:08:31');
INSERT INTO `detections` (`detection_id`, `event_id`, `host_id`, `account_id`, `detection_time`, `detection_type`, `title`, `description`, `status`, `created_at`) VALUES (14, 52, 1, 1, '2026-09-22 01:37:29', 'BRUTE_FORCE', 'Brute-Force Attack Detected', '5 failed login attempts from source IP 192.168.1.60 within the last minute.', 'CONFIRMED', '2026-09-22 01:37:29');

-- Table structure for `employees`
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `department` varchar(150) NOT NULL,
  `password_hash` varchar(128) NOT NULL,
  `password_salt` varchar(64) NOT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `employees`
INSERT INTO `employees` (`id`, `employee_id`, `full_name`, `email`, `phone`, `department`, `password_hash`, `password_salt`, `status`, `last_login`, `created_at`, `updated_at`) VALUES (9, 'SOC-10098', 'you', 'you@gmail.com', '9713036006', 'IT', 'pbkdf2_sha256$600000$9733ee3c3395828781b9679db284dde3a900cf2b4f6fc017c777cb44e8c8e30c', '04b7b070898d5aed8ae119c1c38a3998', 'active', '2026-09-28 00:34:16', '2026-09-28 00:16:11', '2026-09-28 00:34:16');
INSERT INTO `employees` (`id`, `employee_id`, `full_name`, `email`, `phone`, `department`, `password_hash`, `password_salt`, `status`, `last_login`, `created_at`, `updated_at`) VALUES (11, '1001', 'Jaani', 'jaani14365@gmail.com', '9568745123', 'SOC-TIER -1', 'pbkdf2_sha256$600000$db72575e1f9600cad7273f6f29e19ad6b0458852abb7eaad238f39adc2de3579', '817ab095c025676c16b2e441af5b0120', 'active', '2026-09-29 16:05:01', '2026-09-29 16:04:52', '2026-09-29 16:05:01');
INSERT INTO `employees` (`id`, `employee_id`, `full_name`, `email`, `phone`, `department`, `password_hash`, `password_salt`, `status`, `last_login`, `created_at`, `updated_at`) VALUES (12, '100', 'Anuj', 'anuj123@gmail.com', '9226576004', 'SOC-TIER -1', 'pbkdf2_sha256$600000$563d79fb54209500ae5d81d041a594e9e21ddc631ba26403d268b1f1e69b2246', '545f69d5df953397f8d104a0cd374363', 'active', '2026-09-29 16:09:16', '2026-09-29 16:09:11', '2026-09-29 16:09:16');

-- Table structure for `events`
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `event_time` datetime NOT NULL,
  `host_id` int NOT NULL,
  `account_id` int DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_code` varchar(50) DEFAULT NULL,
  `source_ip` varchar(45) DEFAULT NULL,
  `message` text,
  `raw_data` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `idx_events_time` (`event_time`),
  KEY `idx_events_type` (`event_type`),
  KEY `idx_events_source_ip` (`source_ip`),
  KEY `fk_events_host` (`host_id`),
  KEY `fk_events_account` (`account_id`),
  CONSTRAINT `fk_events_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_events_host` FOREIGN KEY (`host_id`) REFERENCES `hosts` (`host_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `events`
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (1, '2026-09-01 16:54:11', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-01 16:54:10');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (2, '2026-09-01 16:54:43', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-01 16:54:43');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (3, '2026-09-01 16:54:45', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-01 16:54:45');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (4, '2026-09-01 16:54:46', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-01 16:54:46');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (5, '2026-09-01 16:54:48', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-01 16:54:47');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (6, '2026-09-17 15:55:53', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-17 15:55:53');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (7, '2026-09-17 15:55:54', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-17 15:55:54');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (8, '2026-09-17 15:55:55', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-17 15:55:55');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (9, '2026-09-17 15:55:56', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-17 15:55:56');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (10, '2026-09-17 15:55:57', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.50', 'Failed login attempt for admin', NULL, '2026-09-17 15:55:57');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (11, '2026-09-17 16:00:48', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.51', 'Failed login attempt for admin', NULL, '2026-09-17 16:00:48');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (12, '2026-09-17 16:00:55', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.51', 'Failed login attempt for admin', NULL, '2026-09-17 16:00:55');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (13, '2026-09-17 16:00:56', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.51', 'Failed login attempt for admin', NULL, '2026-09-17 16:00:56');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (14, '2026-09-17 16:00:57', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.51', 'Failed login attempt for admin', NULL, '2026-09-17 16:00:57');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (15, '2026-09-17 16:00:59', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.51', 'Failed login attempt for admin', NULL, '2026-09-17 16:00:59');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (16, '2026-09-22 00:19:11', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:10');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (17, '2026-09-22 00:19:20', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:20');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (18, '2026-09-22 00:19:25', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:24');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (19, '2026-09-22 00:19:28', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:27');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (20, '2026-09-22 00:19:30', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:30');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (21, '2026-09-22 00:19:33', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:19:33');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (22, '2026-09-22 00:20:07', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:20:07');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (23, '2026-09-22 00:20:15', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:20:14');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (24, '2026-09-22 00:20:22', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:20:22');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (25, '2026-09-22 00:20:31', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:20:30');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (26, '2026-09-22 00:20:38', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.53', 'Failed login attempt for admin', NULL, '2026-09-22 00:20:38');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (27, '2026-09-22 00:38:26', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:38:25');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (28, '2026-09-22 00:38:32', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:38:32');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (29, '2026-09-22 00:38:39', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:38:39');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (30, '2026-09-22 00:38:46', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:38:45');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (31, '2026-09-22 00:39:30', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:39:30');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (32, '2026-09-22 00:41:11', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:41:10');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (33, '2026-09-22 00:42:22', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:42:22');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (34, '2026-09-22 00:42:23', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:42:23');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (35, '2026-09-22 00:42:24', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:42:24');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (36, '2026-09-22 00:42:25', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:42:24');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (37, '2026-09-22 00:42:26', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.54', 'Failed login attempt for admin', NULL, '2026-09-22 00:42:25');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (38, '2026-09-22 00:52:48', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.55', 'Failed login attempt for admin', NULL, '2026-09-22 00:52:48');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (39, '2026-09-22 00:52:50', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.55', 'Failed login attempt for admin', NULL, '2026-09-22 00:52:49');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (40, '2026-09-22 00:52:51', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.55', 'Failed login attempt for admin', NULL, '2026-09-22 00:52:50');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (41, '2026-09-22 00:52:51', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.55', 'Failed login attempt for admin', NULL, '2026-09-22 00:52:51');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (42, '2026-09-22 00:52:52', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.55', 'Failed login attempt for admin', NULL, '2026-09-22 00:52:52');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (43, '2026-09-22 01:08:28', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.56', 'Failed login attempt for admin', NULL, '2026-09-22 01:08:28');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (44, '2026-09-22 01:08:29', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.56', 'Failed login attempt for admin', NULL, '2026-09-22 01:08:29');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (45, '2026-09-22 01:08:29', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.56', 'Failed login attempt for admin', NULL, '2026-09-22 01:08:29');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (46, '2026-09-22 01:08:30', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.56', 'Failed login attempt for admin', NULL, '2026-09-22 01:08:30');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (47, '2026-09-22 01:08:31', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.56', 'Failed login attempt for admin', NULL, '2026-09-22 01:08:31');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (48, '2026-09-22 01:37:26', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.60', 'Failed login attempt for admin', NULL, '2026-09-22 01:37:26');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (49, '2026-09-22 01:37:27', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.60', 'Failed login attempt for admin', NULL, '2026-09-22 01:37:27');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (50, '2026-09-22 01:37:28', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.60', 'Failed login attempt for admin', NULL, '2026-09-22 01:37:28');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (51, '2026-09-22 01:37:28', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.60', 'Failed login attempt for admin', NULL, '2026-09-22 01:37:28');
INSERT INTO `events` (`event_id`, `event_time`, `host_id`, `account_id`, `event_type`, `event_code`, `source_ip`, `message`, `raw_data`, `created_at`) VALUES (52, '2026-09-22 01:37:29', 1, 1, 'LOGIN_FAILED', 'AUTH_FAIL', '192.168.1.60', 'Failed login attempt for admin', NULL, '2026-09-22 01:37:29');

-- Table structure for `hosts`
DROP TABLE IF EXISTS `hosts`;
CREATE TABLE `hosts` (
  `host_id` int NOT NULL AUTO_INCREMENT,
  `host_name` varchar(100) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `host_type` enum('WINDOWS','LINUX','UNIX','SERVER','OTHER') NOT NULL,
  `os` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`host_id`),
  UNIQUE KEY `host_name` (`host_name`),
  UNIQUE KEY `ip_address` (`ip_address`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `hosts`
INSERT INTO `hosts` (`host_id`, `host_name`, `ip_address`, `host_type`, `os`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'SOC-Test-Server', '192.168.1.100', 'SERVER', 'Windows/Linux', 'Local test server for brute-force detection', 1, '2026-09-01 16:49:53', '2026-09-01 16:49:53');

-- Table structure for `incidents`
DROP TABLE IF EXISTS `incidents`;
CREATE TABLE `incidents` (
  `incident_id` bigint NOT NULL AUTO_INCREMENT,
  `detection_id` bigint NOT NULL,
  `incident_time` datetime NOT NULL,
  `severity` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `status` enum('OPEN','INVESTIGATING','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `assigned_to` varchar(100) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`incident_id`),
  UNIQUE KEY `detection_id` (`detection_id`),
  KEY `idx_incidents_time` (`incident_time`),
  KEY `idx_incidents_status` (`status`),
  CONSTRAINT `fk_incidents_detection` FOREIGN KEY (`detection_id`) REFERENCES `detections` (`detection_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `incidents`
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (1, 2, '2026-09-17 15:55:57', 'HIGH', 'Brute-Force Security Incident', 'Brute-force attack detected against account 1 from IP 192.168.1.50. 5 failed login attempts were observed within one minute.', 'OPEN', 'SYSTEM', NULL, '2026-09-17 15:55:57', '2026-09-17 15:55:57');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (2, 3, '2026-09-17 16:00:59', 'HIGH', 'Brute-Force Security Incident', 'Brute-force attack detected against account 1 from IP 192.168.1.51. 5 failed login attempts were observed within one minute.', 'OPEN', 'SYSTEM', NULL, '2026-09-17 16:00:59', '2026-09-17 16:00:59');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (3, 4, '2026-09-22 00:19:31', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 5.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:19:30', '2026-09-22 00:19:30');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (4, 5, '2026-09-22 00:19:33', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 6.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:19:33', '2026-09-22 00:19:33');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (5, 6, '2026-09-22 00:20:07', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 7.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:20:07', '2026-09-22 00:20:07');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (6, 7, '2026-09-22 00:20:15', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 7.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:20:14', '2026-09-22 00:20:14');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (7, 8, '2026-09-22 00:20:22', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 7.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:20:22', '2026-09-22 00:20:22');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (8, 9, '2026-09-22 00:20:31', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 6.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:20:30', '2026-09-22 00:20:30');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (9, 10, '2026-09-22 00:20:38', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.53. Failed attempts: 5.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:20:38', '2026-09-22 00:20:38');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (10, 11, '2026-09-22 00:42:26', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.54. Failed attempts: 5.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:42:26', '2026-09-22 00:42:26');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (11, 12, '2026-09-22 00:52:52', 'HIGH', 'Brute-Force Attack Incident', 'Brute-force activity detected against account ID 1. Source IP: 192.168.1.55. Failed attempts: 5.', 'OPEN', 'SOC-SYSTEM', NULL, '2026-09-22 00:52:52', '2026-09-22 00:52:52');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (12, 13, '2026-09-22 01:08:31', 'HIGH', 'Brute-Force Security Incident', 'Brute-force attack detected from 192.168.1.56. 5 failed login attempts were detected within one minute. Automatic firewall response was executed.', 'OPEN', 'SOC-AUTOMATION', NULL, '2026-09-22 01:08:31', '2026-09-22 01:08:31');
INSERT INTO `incidents` (`incident_id`, `detection_id`, `incident_time`, `severity`, `title`, `description`, `status`, `assigned_to`, `resolved_at`, `created_at`, `updated_at`) VALUES (13, 14, '2026-09-22 01:37:29', 'HIGH', 'Brute-Force Security Incident', 'Brute-force attack detected from 192.168.1.60. 5 failed login attempts were detected within one minute. Automatic firewall response was executed.', 'OPEN', 'SOC-AUTOMATION', NULL, '2026-09-22 01:37:29', '2026-09-22 01:37:29');

-- Table structure for `notifications`
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `incident_id` bigint NOT NULL,
  `notification_time` datetime NOT NULL,
  `notification_type` enum('ALERT','WARNING','INFO','SUCCESS') NOT NULL DEFAULT 'ALERT',
  `channel` enum('DASHBOARD','SYSTEM','EMAIL','OTHER') NOT NULL DEFAULT 'DASHBOARD',
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notifications_time` (`notification_time`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `fk_notifications_incident` (`incident_id`),
  CONSTRAINT `fk_notifications_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`incident_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `notifications`
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (1, 1, '2026-09-17 15:55:57', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.50 generated 5 failed login attempts. Risk level: HIGH. IP block response recorded.', 0, '2026-09-17 15:55:57');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (2, 2, '2026-09-17 16:00:59', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.51 generated 5 failed login attempts. Risk level: HIGH. IP block response recorded.', 0, '2026-09-17 16:00:59');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (3, 3, '2026-09-22 00:19:31', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 5 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:19:30');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (4, 4, '2026-09-22 00:19:33', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 6 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:19:33');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (5, 5, '2026-09-22 00:20:07', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 7 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:20:07');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (6, 6, '2026-09-22 00:20:15', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 7 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:20:14');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (7, 7, '2026-09-22 00:20:22', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 7 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:20:22');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (8, 8, '2026-09-22 00:20:31', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 6 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:20:30');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (9, 9, '2026-09-22 00:20:38', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.53 generated 5 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS.', 0, '2026-09-22 00:20:38');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (10, 10, '2026-09-22 00:42:26', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.54 generated 5 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS. Verification: UNKNOWN.', 0, '2026-09-22 00:42:26');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (11, 11, '2026-09-22 00:52:52', 'ALERT', 'DASHBOARD', 'Brute-Force Attack Detected', 'Source IP 192.168.1.55 generated 5 failed login attempts. Risk level: HIGH. Firewall response: SUCCESS. Verification: UNKNOWN.', 0, '2026-09-22 00:52:52');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (12, 12, '2026-09-22 01:08:31', 'SUCCESS', 'DASHBOARD', 'Brute-Force Attack Alert', 'Brute-force attack detected from 192.168.1.56. 5 failed attempts detected. Firewall response: SUCCESS. Verification: STOPPED.', 0, '2026-09-22 01:08:31');
INSERT INTO `notifications` (`notification_id`, `incident_id`, `notification_time`, `notification_type`, `channel`, `title`, `message`, `is_read`, `created_at`) VALUES (13, 13, '2026-09-22 01:37:29', 'SUCCESS', 'DASHBOARD', 'Brute-Force Attack Alert', 'Brute-force attack detected from 192.168.1.60. 5 failed attempts detected. Firewall response: SUCCESS. Verification: STOPPED.', 0, '2026-09-22 01:37:29');

-- Table structure for `responses`
DROP TABLE IF EXISTS `responses`;
CREATE TABLE `responses` (
  `response_id` bigint NOT NULL AUTO_INCREMENT,
  `risk_id` bigint NOT NULL,
  `response_time` datetime NOT NULL,
  `action_taken` varchar(100) NOT NULL,
  `action_type` enum('ALLOW','ALERT','BLOCK_IP','DISABLE_ACCOUNT','ISOLATE_HOST','OTHER') NOT NULL,
  `target_ip` varchar(45) DEFAULT NULL,
  `details` text,
  `status` enum('SUCCESS','FAILED','PENDING') NOT NULL DEFAULT 'SUCCESS',
  `performed_by` varchar(100) NOT NULL DEFAULT 'SYSTEM',
  PRIMARY KEY (`response_id`),
  KEY `idx_responses_time` (`response_time`),
  KEY `fk_responses_risk` (`risk_id`),
  CONSTRAINT `fk_responses_risk` FOREIGN KEY (`risk_id`) REFERENCES `risks` (`risk_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `responses`
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (1, 2, '2026-09-17 15:55:57', 'Block malicious source IP', 'BLOCK_IP', '192.168.1.50', 'Simulated IP block recorded by Adaptive SOC. Actual operating-system firewall modification is not enabled yet.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (2, 3, '2026-09-17 16:00:59', 'Block malicious source IP', 'BLOCK_IP', '192.168.1.51', 'Simulated IP block recorded by Adaptive SOC. Actual operating-system firewall modification is not enabled yet.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (3, 3, '2026-09-22 00:13:21', 'Block IP using Windows Firewall', 'BLOCK_IP', '192.168.1.52', 'Firewall block executed through Windows netsh.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (4, 4, '2026-09-22 00:19:31', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 5 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (5, 5, '2026-09-22 00:19:33', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 6 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (6, 6, '2026-09-22 00:20:07', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 7 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (7, 7, '2026-09-22 00:20:15', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 7 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (8, 8, '2026-09-22 00:20:22', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 7 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (9, 9, '2026-09-22 00:20:31', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 6 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (10, 10, '2026-09-22 00:20:38', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.53', 'Automatic response triggered after 5 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (11, 11, '2026-09-22 00:42:26', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.54', 'Automatic response triggered after 5 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (12, 12, '2026-09-22 00:52:52', 'Blocked source IP using Windows Firewall', 'BLOCK_IP', '192.168.1.55', 'Automatic response triggered after 5 failed login attempts.', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (13, 13, '2026-09-22 01:08:31', 'Block malicious source IP', 'BLOCK_IP', '192.168.1.56', 'Windows Firewall block rule executed. Firewall result: SUCCESS', 'SUCCESS', 'SYSTEM');
INSERT INTO `responses` (`response_id`, `risk_id`, `response_time`, `action_taken`, `action_type`, `target_ip`, `details`, `status`, `performed_by`) VALUES (14, 14, '2026-09-22 01:37:29', 'Block malicious source IP', 'BLOCK_IP', '192.168.1.60', 'Windows Firewall block rule executed. Firewall result: SUCCESS', 'SUCCESS', 'SYSTEM');

-- Table structure for `risks`
DROP TABLE IF EXISTS `risks`;
CREATE TABLE `risks` (
  `risk_id` bigint NOT NULL AUTO_INCREMENT,
  `detection_id` bigint NOT NULL,
  `risk_score` int NOT NULL,
  `risk_level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  `confidence` decimal(5,2) NOT NULL,
  `factors` json DEFAULT NULL,
  `calculated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`risk_id`),
  UNIQUE KEY `detection_id` (`detection_id`),
  KEY `idx_risks_level` (`risk_level`),
  CONSTRAINT `fk_risks_detection` FOREIGN KEY (`detection_id`) REFERENCES `detections` (`detection_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `risks`
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (1, 1, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-01 16:54:47');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (2, 2, 85, 'HIGH', '95.00', '{"source_ip": "192.168.1.50", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5, "privileged_account": true}', '2026-09-17 15:55:57');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (3, 3, 85, 'HIGH', '95.00', '{"source_ip": "192.168.1.51", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5, "privileged_account": true}', '2026-09-17 16:00:59');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (4, 4, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 00:19:30');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (5, 5, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 6}', '2026-09-22 00:19:33');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (6, 6, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 7}', '2026-09-22 00:20:07');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (7, 7, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 7}', '2026-09-22 00:20:14');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (8, 8, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 7}', '2026-09-22 00:20:22');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (9, 9, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 6}', '2026-09-22 00:20:30');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (10, 10, 75, 'HIGH', '95.00', '{"attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 00:20:38');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (11, 11, 75, 'HIGH', '95.00', '{"source_ip": "192.168.1.54", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 00:42:25');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (12, 12, 75, 'HIGH', '95.00', '{"source_ip": "192.168.1.55", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 00:52:52');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (13, 13, 75, 'HIGH', '95.00', '{"source_ip": "192.168.1.56", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 01:08:31');
INSERT INTO `risks` (`risk_id`, `detection_id`, `risk_score`, `risk_level`, `confidence`, `factors`, `calculated_at`) VALUES (14, 14, 75, 'HIGH', '95.00', '{"source_ip": "192.168.1.60", "attack_type": "BRUTE_FORCE", "time_window": "1 minute", "failed_attempts": 5}', '2026-09-22 01:37:29');

-- Table structure for `system_settings`
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for `verifications`
DROP TABLE IF EXISTS `verifications`;
CREATE TABLE `verifications` (
  `verification_id` bigint NOT NULL AUTO_INCREMENT,
  `response_id` bigint NOT NULL,
  `verified_at` datetime NOT NULL,
  `attempts_before` int NOT NULL,
  `attempts_after` int NOT NULL,
  `result` enum('STOPPED','CONTINUING','PARTIAL','UNKNOWN') NOT NULL,
  `notes` text,
  `verified_by` varchar(100) NOT NULL DEFAULT 'SYSTEM',
  PRIMARY KEY (`verification_id`),
  KEY `idx_verifications_time` (`verified_at`),
  KEY `fk_verifications_response` (`response_id`),
  CONSTRAINT `fk_verifications_response` FOREIGN KEY (`response_id`) REFERENCES `responses` (`response_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for `verifications`
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (1, 1, '2026-09-17 15:55:57', 5, 5, 'UNKNOWN', 'Response recorded successfully. Actual firewall enforcement is not enabled.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (2, 2, '2026-09-17 16:00:59', 5, 5, 'UNKNOWN', 'Response recorded successfully. Actual firewall enforcement is not enabled.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (3, 4, '2026-09-22 00:19:31', 5, 5, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (4, 5, '2026-09-22 00:19:33', 6, 6, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (5, 6, '2026-09-22 00:20:07', 7, 7, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (6, 7, '2026-09-22 00:20:15', 7, 7, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (7, 8, '2026-09-22 00:20:22', 7, 7, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (8, 9, '2026-09-22 00:20:31', 6, 6, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (9, 10, '2026-09-22 00:20:38', 5, 5, 'STOPPED', 'Windows Firewall block command executed by Adaptive SOC.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (10, 11, '2026-09-22 00:42:26', 5, 5, 'UNKNOWN', 'Windows Firewall rule was checked after the block command. Verification confirms that the rule exists, is enabled, and has BLOCK action for the target source IP.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (11, 12, '2026-09-22 00:52:52', 5, 5, 'UNKNOWN', 'Windows Firewall rule was checked after the block command. Verification confirms that the rule exists, is enabled, and has BLOCK action for the target source IP.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (12, 13, '2026-09-22 01:08:31', 5, 5, 'STOPPED', 'Windows Firewall rule verified using netsh.', 'SYSTEM');
INSERT INTO `verifications` (`verification_id`, `response_id`, `verified_at`, `attempts_before`, `attempts_after`, `result`, `notes`, `verified_by`) VALUES (13, 14, '2026-09-22 01:37:29', 5, 5, 'STOPPED', 'Windows Firewall rule verified using netsh.', 'SYSTEM');

SET FOREIGN_KEY_CHECKS=1;
