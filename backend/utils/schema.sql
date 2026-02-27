-- ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
-- Smart Bursar System ΓÇö MySQL Schema & Seed Data
-- Generated on 2026-02-27T17:33:02.342Z
-- ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

CREATE DATABASE IF NOT EXISTS smart_bursar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_bursar;

SET FOREIGN_KEY_CHECKS = 0;

-- ΓöÇΓöÇ Table: academic_terms ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `academic_terms` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `term_name` varchar(20) NOT NULL,
  `academic_year` varchar(12) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_term_year` (`term_name`,`academic_year`),
  KEY `fk_academic_terms_school` (`school_id`),
  CONSTRAINT `fk_academic_terms_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `academic_terms` (`id`, `term_name`, `academic_year`, `start_date`, `end_date`, `is_active`, `created_at`, `school_id`) VALUES
  (1, 'Term 1', '2024/2025', '2025-01-05 22:00:00', '2025-04-10 22:00:00', 1, '2026-02-27 09:49:27', 1),
  (2, 'Term 2', '2024/2025', '2025-05-04 22:00:00', '2025-07-31 22:00:00', 0, '2026-02-27 09:49:27', 1),
  (3, 'Term 3', '2024/2025', '2025-08-24 22:00:00', '2025-11-27 22:00:00', 0, '2026-02-27 09:49:27', 1);

-- ΓöÇΓöÇ Table: audit_logs ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(60) NOT NULL,
  `entity` varchar(40) DEFAULT NULL,
  `entity_id` int(10) unsigned DEFAULT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_audit_logs_school` (`school_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_audit_logs_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ΓöÇΓöÇ Table: classes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `classes` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(15) NOT NULL,
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `fk_classes_school` (`school_id`),
  CONSTRAINT `fk_classes_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `classes` (`id`, `name`, `school_id`) VALUES
  (1, 'Nursery', 1),
  (2, 'P1', 1),
  (3, 'P2', 1),
  (4, 'P3', 1),
  (5, 'P4', 1),
  (6, 'P5', 1),
  (7, 'P6', 1),
  (8, 'S1', 1),
  (9, 'S2', 1),
  (10, 'S3', 1),
  (11, 'S4', 1),
  (12, 'S5', 1),
  (13, 'S6', 1);

-- ΓöÇΓöÇ Table: email_notifications ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `email_notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `recipient` varchar(150) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template` varchar(60) NOT NULL,
  `status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `error_msg` text DEFAULT NULL,
  `school_id` int(10) unsigned DEFAULT NULL,
  `related_id` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_notifications` (`id`, `recipient`, `subject`, `template`, `status`, `sent_at`, `error_msg`, `school_id`, `related_id`, `created_at`) VALUES
  (1, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 14:11:51'),
  (2, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 14:26:57'),
  (3, 'kaberukarwemadanny@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 14:28:36'),
  (4, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 14:29:18'),
  (5, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 15:16:44'),
  (6, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'failed', NULL, 'self-signed certificate in certificate chain', NULL, NULL, '2026-02-27 15:18:48'),
  (7, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'sent', '2026-02-27 15:23:53', NULL, NULL, NULL, '2026-02-27 15:23:50'),
  (8, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'sent', '2026-02-27 15:26:54', NULL, NULL, NULL, '2026-02-27 15:26:51'),
  (9, 'yakinnsanzumuhire@gmail.com', 'You''ve been added as a Smart Bursar SuperAdmin', 'superadminInvite', 'sent', '2026-02-27 15:28:39', NULL, NULL, NULL, '2026-02-27 15:28:35'),
  (10, 'yakinnsanzumuhire@gmail.com', 'Welcome to Smart Bursar ΓÇö Your Account is Ready', 'welcome', 'sent', '2026-02-27 15:47:49', NULL, NULL, NULL, '2026-02-27 15:47:46'),
  (11, 'tyakorigy03@gmail.com', 'Welcome to Smart Bursar ΓÇö Your Account is Ready', 'welcome', 'sent', '2026-02-27 15:49:34', NULL, NULL, NULL, '2026-02-27 15:49:31'),
  (12, 'lanari.rw@gmail.com', 'Student Enrollment Notification ΓÇö Kenza International School', 'parentEnrollment', 'pending', NULL, NULL, NULL, NULL, '2026-02-27 16:24:20'),
  (13, 'kaberukarwemadanny@gmail.com', 'Your Smart Bursar Account is Ready ΓÇö apeki tumba tss', 'newSchool', 'sent', '2026-02-27 16:32:41', NULL, NULL, NULL, '2026-02-27 16:32:38'),
  (14, 'kaberukarwemadanny@gmail.com', 'Student Enrollment Notification ΓÇö Kenza International School', 'parentEnrollment', 'pending', NULL, NULL, NULL, NULL, '2026-02-27 16:41:38'),
  (15, 'lanari.rw@gmail.com', 'Student Enrollment Notification ΓÇö Kenza International School', 'parentEnrollment', 'sent', '2026-02-27 17:06:19', NULL, 1, NULL, '2026-02-27 17:06:15'),
  (16, 'lanari.rw@gmail.com', 'Welcome to Smart Bursar ΓÇö Your Account is Ready', 'welcome', 'sent', '2026-02-27 17:06:53', NULL, 1, NULL, '2026-02-27 17:06:50'),
  (17, 'lanari.rw@gmail.com', 'Welcome to Smart Bursar ΓÇö Your Account is Ready', 'welcome', 'sent', '2026-02-27 17:14:35', NULL, 1, NULL, '2026-02-27 17:14:31'),
  (18, 'lanari.rw@gmail.com', '895547 is your Smart Bursar login code', 'otp', 'sent', '2026-02-27 17:16:56', NULL, 1, NULL, '2026-02-27 17:16:53'),
  (19, 'lanari.rw@gmail.com', '683700 is your Smart Bursar login code', 'otp', 'sent', '2026-02-27 17:21:12', NULL, 1, NULL, '2026-02-27 17:21:09'),
  (20, 'lanari.rw@gmail.com', '198028 is your Smart Bursar login code', 'otp', 'sent', '2026-02-27 17:26:58', NULL, 1, NULL, '2026-02-27 17:26:54');

-- ΓöÇΓöÇ Table: expenses ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `expenses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `expense_no` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `category` enum('Administrative','Transport','Utilities','Operations','Equipment','Payroll','Other') NOT NULL,
  `amount` int(10) unsigned NOT NULL,
  `vendor` varchar(150) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `term_id` int(10) unsigned NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `submitted_by` int(10) unsigned NOT NULL,
  `approved_by` int(10) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_no` (`expense_no`),
  KEY `term_id` (`term_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `approved_by` (`approved_by`),
  KEY `fk_expenses_school` (`school_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`id`),
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_expenses_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `expenses` (`id`, `expense_no`, `description`, `category`, `amount`, `vendor`, `reference`, `expense_date`, `term_id`, `status`, `submitted_by`, `approved_by`, `approved_at`, `notes`, `created_at`, `updated_at`, `school_id`) VALUES
  (1, 'EXP-2025-001', 'Stationery Supplies', 'Administrative', 85000, 'Office Depot', 'REC-001', '2025-02-22 22:00:00', 1, 'Approved', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (2, 'EXP-2025-002', 'Bus Maintenance', 'Transport', 240000, 'Auto Care Ltd', 'REC-002', '2025-02-21 22:00:00', 1, 'Approved', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (3, 'EXP-2025-003', 'Internet Bill ΓÇö MTN', 'Utilities', 45000, 'MTN Business', NULL, '2025-02-20 22:00:00', 1, 'Pending', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (4, 'EXP-2025-004', 'Cafeteria Groceries', 'Operations', 168000, 'Fresh Foods RW', 'REC-003', '2025-02-18 22:00:00', 1, 'Approved', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (5, 'EXP-2025-005', 'Security Guard Salary', 'Payroll', 120000, 'Internal', 'PAY-014', '2025-02-13 22:00:00', 1, 'Approved', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (6, 'EXP-2025-006', 'Generator Fuel', 'Utilities', 60000, 'Total Energies', 'REC-004', '2025-02-12 22:00:00', 1, 'Approved', 2, NULL, NULL, NULL, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1);

-- ΓöÇΓöÇ Table: fee_structure ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `fee_structure` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` smallint(5) unsigned NOT NULL,
  `term_id` int(10) unsigned NOT NULL,
  `tuition` int(10) unsigned NOT NULL DEFAULT 0,
  `activity` int(10) unsigned NOT NULL DEFAULT 0,
  `transport` int(10) unsigned NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_term` (`class_id`,`term_id`),
  KEY `term_id` (`term_id`),
  KEY `fk_fee_structure_school` (`school_id`),
  CONSTRAINT `fee_structure_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `fee_structure_ibfk_2` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`id`),
  CONSTRAINT `fk_fee_structure_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fee_structure` (`id`, `class_id`, `term_id`, `tuition`, `activity`, `transport`, `updated_at`, `school_id`) VALUES
  (1, 1, 1, 180000, 20000, 0, '2026-02-27 09:49:36', 1),
  (2, 2, 1, 240000, 25000, 0, '2026-02-27 09:49:36', 1),
  (3, 3, 1, 240000, 25000, 0, '2026-02-27 09:49:36', 1),
  (4, 4, 1, 260000, 25000, 0, '2026-02-27 09:49:36', 1),
  (5, 5, 1, 260000, 30000, 0, '2026-02-27 09:49:36', 1),
  (6, 6, 1, 280000, 30000, 0, '2026-02-27 09:49:36', 1),
  (7, 7, 1, 280000, 30000, 0, '2026-02-27 09:49:36', 1),
  (8, 8, 1, 380000, 40000, 0, '2026-02-27 09:49:36', 1),
  (9, 9, 1, 380000, 40000, 0, '2026-02-27 09:49:36', 1),
  (10, 10, 1, 400000, 40000, 0, '2026-02-27 09:49:36', 1),
  (11, 11, 1, 420000, 45000, 0, '2026-02-27 09:49:36', 1),
  (12, 12, 1, 420000, 45000, 0, '2026-02-27 09:49:36', 1),
  (13, 13, 1, 450000, 50000, 0, '2026-02-27 09:49:36', 1);

-- ΓöÇΓöÇ Table: invoices ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `invoices` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(30) NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `term_id` int(10) unsigned NOT NULL,
  `tuition_amount` int(10) unsigned NOT NULL DEFAULT 0,
  `activity_amount` int(10) unsigned NOT NULL DEFAULT 0,
  `transport_amount` int(10) unsigned NOT NULL DEFAULT 0,
  `total_amount` int(10) unsigned NOT NULL DEFAULT 0,
  `issued_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `created_by` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  UNIQUE KEY `uq_student_term` (`student_id`,`term_id`),
  KEY `term_id` (`term_id`),
  KEY `created_by` (`created_by`),
  KEY `fk_invoices_school` (`school_id`),
  CONSTRAINT `fk_invoices_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`id`),
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoices` (`id`, `invoice_no`, `student_id`, `term_id`, `tuition_amount`, `activity_amount`, `transport_amount`, `total_amount`, `issued_date`, `due_date`, `created_by`, `created_at`, `school_id`) VALUES
  (1, 'INV-2025-0001', 1, 1, 400000, 40000, 0, 440000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (2, 'INV-2025-0002', 2, 1, 280000, 30000, 0, 310000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (3, 'INV-2025-0003', 3, 1, 420000, 45000, 0, 465000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (4, 'INV-2025-0004', 4, 1, 380000, 40000, 0, 420000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (5, 'INV-2025-0005', 5, 1, 260000, 30000, 0, 290000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (6, 'INV-2025-0006', 6, 1, 380000, 40000, 0, 420000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (7, 'INV-2025-0007', 7, 1, 420000, 45000, 0, 465000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (8, 'INV-2025-0008', 8, 1, 280000, 30000, 0, 310000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (9, 'INV-2025-0009', 9, 1, 380000, 40000, 0, 420000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1),
  (10, 'INV-2025-0010', 10, 1, 260000, 25000, 0, 285000, '2025-01-05 22:00:00', NULL, 2, '2026-02-27 09:49:36', 1);

-- ΓöÇΓöÇ Table: login_otps ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `login_otps` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `school_id` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `login_otps_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `login_otps` (`id`, `email`, `otp_hash`, `expires_at`, `used`, `school_id`, `created_at`) VALUES
  (1, 'lanari.rw@gmail.com', '$2a$10$M7d/CYSNdNodVLSfDtvzcu9TpYXR05F12..3cho1zkneOqO5wtqY2', '2026-02-27 15:16:50', 0, NULL, '2026-02-27 17:06:50'),
  (2, 'lanari.rw@gmail.com', '$2a$10$tLh6w9d/C5A4RT2pQ5Blh.Ag9DccD19fiTG/ccIFx6t/D/NL57nNi', '2026-02-27 15:24:31', 0, NULL, '2026-02-27 17:14:31'),
  (3, 'lanari.rw@gmail.com', '$2a$10$RbKpmOMIrdC/oWpYeS72Au89Jv6MgK/8bAV3ihQV20F2.YFfPoJX6', '2026-02-27 15:26:53', 0, NULL, '2026-02-27 17:16:53'),
  (4, 'lanari.rw@gmail.com', '$2a$10$tA9cqMYxRj9aGxXHJ8rP9OWouGRkijw99ApEN03x3wkNXUiL9kW9i', '2026-02-27 15:31:09', 0, NULL, '2026-02-27 17:21:09'),
  (5, 'lanari.rw@gmail.com', '$2a$10$LUTiwRiymX5J8qtBnqMAb.MpSlL2HzNc4vBnZiOU1b/XTBa58NB36', '2026-02-27 17:27:12', 1, NULL, '2026-02-27 17:26:54');

-- ΓöÇΓöÇ Table: password_reset_tokens ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `password_reset_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ΓöÇΓöÇ Table: payments ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(30) NOT NULL,
  `invoice_id` int(10) unsigned NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `term_id` int(10) unsigned NOT NULL,
  `amount` int(10) unsigned NOT NULL,
  `payment_method` enum('Cash','MoMo','Bank') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `payment_time` time NOT NULL,
  `cashier_id` int(10) unsigned NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `invoice_id` (`invoice_id`),
  KEY `student_id` (`student_id`),
  KEY `term_id` (`term_id`),
  KEY `cashier_id` (`cashier_id`),
  KEY `fk_payments_school` (`school_id`),
  CONSTRAINT `fk_payments_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`id`),
  CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` (`id`, `receipt_no`, `invoice_id`, `student_id`, `term_id`, `amount`, `payment_method`, `reference`, `payment_date`, `payment_time`, `cashier_id`, `notes`, `created_at`, `school_id`) VALUES
  (1, 'RCP-2025-0091', 1, 1, 1, 220000, 'MoMo', '250788001001', '2025-01-14 22:00:00', '09:20:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (2, 'RCP-2025-0112', 1, 1, 1, 220000, 'Bank', 'BNK-4421', '2025-02-09 22:00:00', '10:05:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (3, 'RCP-2025-0077', 2, 2, 1, 310000, 'Cash', NULL, '2025-01-11 22:00:00', '08:45:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (4, 'RCP-2025-0055', 4, 4, 1, 420000, 'MoMo', '250788004004', '2025-01-09 22:00:00', '11:00:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (5, 'RCP-2025-0042', 5, 5, 1, 290000, 'Cash', NULL, '2025-01-07 22:00:00', '09:10:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (6, 'RCP-2025-0031', 7, 7, 1, 150000, 'Cash', NULL, '2025-01-06 22:00:00', '08:30:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (7, 'RCP-2025-0088', 8, 8, 1, 310000, 'Bank', 'BNK-3309', '2025-01-13 22:00:00', '10:30:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (8, 'RCP-2025-0099', 9, 9, 1, 200000, 'MoMo', '250788009009', '2025-01-31 22:00:00', '09:00:00', 2, NULL, '2026-02-27 09:49:36', 1),
  (9, 'RCP-2025-0121', 9, 9, 1, 100000, 'Cash', NULL, '2025-02-19 22:00:00', '10:15:00', 2, NULL, '2026-02-27 09:49:36', 1);

-- ΓöÇΓöÇ Table: receipt_counter ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `receipt_counter` (
  `term_id` int(10) unsigned NOT NULL,
  `last_seq` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`term_id`),
  CONSTRAINT `receipt_counter_ibfk_1` FOREIGN KEY (`term_id`) REFERENCES `academic_terms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `receipt_counter` (`term_id`, `last_seq`) VALUES
  (1, 123);

-- ΓöÇΓöÇ Table: roles ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `roles` (
  `id` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `name`) VALUES
  (3, 'accountant'),
  (1, 'admin'),
  (2, 'bursar'),
  (5, 'parent'),
  (4, 'principal');

-- ΓöÇΓöÇ Table: school_config ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `school_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(60) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_school_setting` (`school_id`,`setting_key`),
  CONSTRAINT `fk_school_config_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `school_config` (`id`, `setting_key`, `setting_value`, `updated_at`, `school_id`) VALUES
  (1, 'school_name', 'Kenza International School', '2026-02-27 09:49:26', 1),
  (2, 'address', 'KG 11 Ave, Kigali, Rwanda', '2026-02-27 09:49:26', 1),
  (3, 'tel', '+250 788 123 456', '2026-02-27 09:49:26', 1),
  (4, 'email', 'bursar@kenza.rw', '2026-02-27 09:49:26', 1),
  (5, 'current_term', 'Term 1', '2026-02-27 09:49:26', 1),
  (6, 'current_year', '2024/2025', '2026-02-27 09:49:26', 1),
  (7, 'receipt_prefix', 'RCP', '2026-02-27 09:49:26', 1),
  (8, 'invoice_prefix', 'INV', '2026-02-27 09:49:26', 1),
  (9, 'expense_prefix', 'EXP', '2026-02-27 09:49:26', 1);

-- ΓöÇΓöÇ Table: schools ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `schools` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(60) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `tel` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `subscription` enum('trial','basic','premium') NOT NULL DEFAULT 'trial',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `trial_ends_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schools` (`id`, `name`, `slug`, `address`, `tel`, `email`, `logo_url`, `subscription`, `is_active`, `trial_ends_at`, `created_at`, `updated_at`) VALUES
  (1, 'Kenza International School', 'kenza-international', 'KG 11 Ave, Kigali, Rwanda', '+250 788 123 456', 'info@kenza.rw', NULL, 'trial', 1, NULL, '2026-02-27 09:49:27', '2026-02-27 09:49:27'),
  (2, 'apeki tumba tss', 'apeki-tumba-tss-1772209958414', 'musanze ,rwanda', '0795987348', 'kaberukarwemadanny@gmail.com', NULL, 'premium', 1, '2026-03-28 22:00:00', '2026-02-27 16:32:38', '2026-02-27 16:32:38');

-- ΓöÇΓöÇ Table: students ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `students` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `class_id` smallint(5) unsigned NOT NULL,
  `stream` char(1) NOT NULL DEFAULT 'A',
  `guardian_name` varchar(100) DEFAULT NULL,
  `guardian_tel` varchar(20) DEFAULT NULL,
  `guardian_email` varchar(150) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `enrolled_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_no` (`admission_no`),
  KEY `class_id` (`class_id`),
  KEY `fk_students_school` (`school_id`),
  CONSTRAINT `fk_students_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `students` (`id`, `admission_no`, `full_name`, `class_id`, `stream`, `guardian_name`, `guardian_tel`, `guardian_email`, `is_active`, `enrolled_at`, `created_at`, `updated_at`, `school_id`) VALUES
  (1, 'KIS/2024/0041', 'Amara Uwase', 10, 'A', 'Uwase Emmanuel', '+250 788 001 001', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (2, 'KIS/2024/0089', 'Jean Pierre Nziza', 7, 'B', 'Nziza Th├⌐ophile', '+250 788 002 002', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (3, 'KIS/2024/0055', 'Eric Habimana', 12, 'A', 'Habimana Faustin', '+250 788 003 003', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (4, 'KIS/2023/0120', 'Clarisse Mukamana', 8, 'C', 'Mukamana Vestine', '+250 788 004 004', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (5, 'KIS/2023/0077', 'Divine Ineza', 5, 'A', 'Ineza Alexis', '+250 788 005 005', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (6, 'KIS/2024/0033', 'Sandra Umutoni', 9, 'B', 'Umutoni Chantal', '+250 788 006 006', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (7, 'KIS/2023/0088', 'Samuel Rukundo', 11, 'B', 'Rukundo Callixte', '+250 788 007 007', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (8, 'KIS/2024/0102', 'Grace Mukamurenzi', 6, 'A', 'Mukamurenzi Pius', '+250 788 008 008', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (9, 'KIS/2024/0114', 'Patrick Bizimana', 9, 'C', 'Bizimana Robert', '+250 788 009 009', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (10, 'KIS/2024/0061', 'Josiane Ingabire', 4, 'B', 'Ingabire Odette', '+250 788 010 010', NULL, 1, '2026-02-26 22:00:00', '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (11, '2000', 'ganza aime', 2, 'A', 'hozana', '0792719347', 'lanari.rw@gmail.com', 1, '2026-02-26 22:00:00', '2026-02-27 16:24:18', '2026-02-27 16:24:18', 1),
  (12, 'kane', 'Kaberuka rwema Danny', 2, 'A', 'emy', 'emy', 'kaberukarwemadanny@gmail.com', 1, '2026-02-26 22:00:00', '2026-02-27 16:41:38', '2026-02-27 16:41:38', 2);

-- ΓöÇΓöÇ Table: superadmin_reset_tokens ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `superadmin_reset_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int(10) unsigned NOT NULL,
  `token` varchar(128) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `superadmin_reset_tokens_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `superadmins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ΓöÇΓöÇ Table: superadmins ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `superadmins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `superadmins` (`id`, `name`, `email`, `password_hash`, `is_active`, `last_login`, `created_at`) VALUES
  (1, 'Platform Admin', 'superadmin@smartbursar.rw', '$2a$10$439qJ.PWFdDw8ErT6T.PVuSkS668rxnotGnIFmNVGBpdRqgndQlFy', 1, '2026-02-27 16:34:07', '2026-02-27 10:13:49'),
  (2, 'kane', 'tyakorigy03@gmail.com', '$2a$10$K2of4nQameXnleB3ZpxL7esW4ZoCUSNE1RpZ/te/sM1cEv.rBBZb2', 1, NULL, '2026-02-27 14:06:49'),
  (3, 'kane wacu', 'yakinnsanzumuhire@gmail.com', '$2a$10$o9zXP17ACCM6HjHnhmzI7.TU5AwjzbbrE2cMo/EQd1UYVJgFkY4ry', 1, NULL, '2026-02-27 14:11:51'),
  (5, 'mubi', 'kaberukarwemadanny@gmail.com', '$2a$10$aBr1tIjh1w/UQTlKbwJIwu5DTvAeT54cNoyrwV/fofYE89mBGDfyW', 1, NULL, '2026-02-27 14:28:36');

-- ΓöÇΓöÇ Table: users ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` tinyint(3) unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `school_id` int(10) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `fk_users_school` (`school_id`),
  CONSTRAINT `fk_users_school` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role_id`, `is_active`, `created_at`, `updated_at`, `school_id`) VALUES
  (1, 'System Admin', 'admin@kenza.rw', '$2a$10$IzRyYJe0OfHTeejO.KLkbOFOYE5AOeXvMV0ESfBMmNUdgRj4VFbeO', 1, 1, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (2, 'Uwimana Solange', 'bursar@kenza.rw', '$2a$10$IzRyYJe0OfHTeejO.KLkbOFOYE5AOeXvMV0ESfBMmNUdgRj4VFbeO', 2, 1, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (3, 'Nkurunziza Alain', 'accountant@kenza.rw', '$2a$10$IzRyYJe0OfHTeejO.KLkbOFOYE5AOeXvMV0ESfBMmNUdgRj4VFbeO', 3, 1, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (4, 'Dr. Mutesi Claire', 'principal@kenza.rw', '$2a$10$IzRyYJe0OfHTeejO.KLkbOFOYE5AOeXvMV0ESfBMmNUdgRj4VFbeO', 4, 1, '2026-02-27 09:49:36', '2026-02-27 09:49:36', 1),
  (5, 'kane', 'yakinnsanzumuhire@gmail.com', '$2a$10$OKBnmNhBHjvH05p7Vsiy2uENL6/5/3099UzwbWWV/nBEk.hHHVgM2', 2, 1, '2026-02-27 15:35:51', '2026-02-27 15:47:46', 1),
  (6, 'kane ', 'tyakorigy03@gmail.com', '$2a$10$jd0slyZqjqqA2Hu0Lus6o.86wTv4JF9v0hN4OI81I1i32dIghwRam', 2, 1, '2026-02-27 15:49:31', '2026-02-27 15:49:31', 1),
  (7, 'hozana', 'lanari.rw@gmail.com', '$2a$10$ioWl3dbDo/4Xykhcht8cv.5kKu9oX20vA0fAp7fOfGmjypmiUR5Ne', 5, 1, '2026-02-27 16:24:20', '2026-02-27 16:24:20', 1),
  (8, 'Kaberuka rwema Danny', 'kaberukarwemadanny@gmail.com', '$2a$10$ffwzlcwUgmno.jyyDpYw/e9MV27qB7KI6oZ6xPQn7XPbvKGCI98g6', 1, 1, '2026-02-27 16:32:38', '2026-02-27 16:32:38', 2);

SET FOREIGN_KEY_CHECKS = 1;

