<?php
// Database configuration
$host = 'localhost';
$username = 'root';  // Default XAMPP username
$password = '';      // Default XAMPP password (empty)
$database = 'user_management'; // Change this to your database name

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8
$conn->set_charset("utf8");
?>