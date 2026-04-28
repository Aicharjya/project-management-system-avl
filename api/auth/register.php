<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$name || !$email || !$password) {
    jsonResponse(false, null, 'Missing required fields', 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, null, 'Invalid email', 400);
}

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, 'Email already registered', 400);
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $ins = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $ins->execute([$name, $email, $password_hash]);
    $userId = (int)$pdo->lastInsertId();

    // Auto-login: start session
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;

    jsonResponse(true, ['id' => $userId, 'name' => $name, 'email' => $email], 'User registered', 201);
} catch (Exception $ex) {
    sendServerError($ex->getMessage());
}

?>
