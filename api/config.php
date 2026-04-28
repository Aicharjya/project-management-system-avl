<?php
// Database configuration - update these values for your XAMPP setup
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'abs_project_manager');
define('DB_USER', 'root');
define('DB_PASS', '');

// recommended PDO options
define('PDO_OPTIONS', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

// session settings
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
// Start session in scripts that require it (helpers will call session_start())

?>
