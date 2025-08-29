-- Digital ID System Database Schema
-- Run this SQL script in your MySQL database

CREATE DATABASE IF NOT EXISTS digital_id_system;
USE digital_id_system;

-- Officers table (for application officers)
CREATE TABLE officers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    station VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table (for ID applications)
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    officer_id INT,
    application_type ENUM('new', 'renewal') NOT NULL,
    
    -- Personal Information
    full_names VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female') NULL,
    father_name VARCHAR(100) NULL,
    mother_name VARCHAR(100) NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed'),
    husband_name VARCHAR(100) NULL,
    husband_id_no VARCHAR(20) NULL,
    
    -- Location Information  
    district_of_birth VARCHAR(100) NULL,
    tribe VARCHAR(100) NULL,
    clan VARCHAR(100),
    family VARCHAR(100),
    home_district VARCHAR(100) NULL,
    division VARCHAR(100) NULL,
    constituency VARCHAR(100) NULL,
    location VARCHAR(100) NULL,
    sub_location VARCHAR(100) NULL,
    village_estate VARCHAR(100) NULL,
    home_address VARCHAR(255),
    occupation VARCHAR(100) NULL,
    
    -- Supporting Documents (JSON field for document info)
    supporting_documents JSON,
    
    -- For renewals
    existing_id_number VARCHAR(20) NULL,
    renewal_reason ENUM('lost', 'damaged', 'expired') NULL,
    ob_number VARCHAR(50) NULL,
    waiting_card_number VARCHAR(50) NULL,
    
    -- Application status
    status ENUM('submitted', 'approved', 'rejected', 'dispatched', 'ready_for_collection', 'collected') DEFAULT 'submitted',
    
    -- Generated ID number (after approval)
    generated_id_number VARCHAR(20) UNIQUE NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (officer_id) REFERENCES officers(id)
);

-- Documents table (for storing file paths of uploaded documents)
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_type ENUM('passport_photo', 'fingerprints', 'birth_certificate', 'parent_id_front', 'parent_id_back', 'ob_photo') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- Payments table (for renewal payments)
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'mpesa') NOT NULL,
    mpesa_transaction_id VARCHAR(50) NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- Status history table (for tracking status changes)
CREATE TABLE status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_admin_id INT NULL,
    changed_by_officer_id INT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (changed_by_admin_id) REFERENCES admins(id),
    FOREIGN KEY (changed_by_officer_id) REFERENCES officers(id)
);

-- Insert default admin user
INSERT INTO admins (username, full_name, password_hash) 
VALUES ('admin', 'System Administrator', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfT1bfaXHOGTCK2');
-- Default username: 'admin', password: 'admin123' - change this immediately

-- Create indexes for better performance
CREATE INDEX idx_officers_email ON officers(email);
CREATE INDEX idx_officers_status ON officers(status);
CREATE INDEX idx_applications_number ON applications(application_number);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_officer ON applications(officer_id);
CREATE INDEX idx_documents_application ON documents(application_id);