<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed', 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || !$password) jsonResponse(false, null, 'Missing credentials', 400);

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(false, null, 'Invalid email or password', 401);
    }

    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];

    jsonResponse(true, ['id' => (int)$user['id'], 'name' => $user['name'], 'email' => $user['email']], 'Logged in', 200);
} catch (Exception $ex) {
    sendServerError($ex->getMessage());
}

?>
