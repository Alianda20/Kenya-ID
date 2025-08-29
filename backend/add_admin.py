#!/usr/bin/env python3
"""
Script to add admin users to the Digital ID system
Run this script from terminal to add admin accounts
"""

import mysql.connector
from werkzeug.security import generate_password_hash
import sys

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',  # Your MySQL username
    'password': '',  # Your MySQL password
    'database': 'digital_id_system'
}

def add_admin():
    try:
        # Get admin details from user input
        print("=== Add New Admin ===")
        username = input("Enter admin username: ").strip()
        full_name = input("Enter admin full name: ").strip()
        password = input("Enter admin password: ").strip()
        
        if not username or not full_name or not password:
            print("Error: All fields are required!")
            return
        
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if admin already exists
        cursor.execute("SELECT id FROM admins WHERE username = %s", (username,))
        if cursor.fetchone():
            print(f"Error: Admin with username '{username}' already exists!")
            return
        
        # Hash password
        hashed_password = generate_password_hash(password, method='scrypt')
        
        # Insert new admin
        cursor.execute("""
            INSERT INTO admins (username, full_name, password_hash)
            VALUES (%s, %s, %s)
        """, (username, full_name, hashed_password))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Admin '{username}' added successfully!")
        print(f"Full Name: {full_name}")
        print("Admin can now login to the system.")
        
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")

def list_admins():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, username, full_name, created_at FROM admins ORDER BY created_at DESC")
        admins = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not admins:
            print("No admins found in the system.")
            return
        
        print("\n=== Current Admins ===")
        for admin in admins:
            print(f"ID: {admin['id']} | Username: {admin['username']} | Name: {admin['full_name']} | Created: {admin['created_at']}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_admins()
    else:
        add_admin()