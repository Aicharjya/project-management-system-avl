<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

try {
    $userId = requireAuth();
    $pdo = getPDO();

    $key = $_GET['key'] ?? 'priority';
    $allowed = ['priority','due_date','start_date','title'];
    if (!in_array($key, $allowed)) $key = 'priority';
    $order = (isset($_GET['order']) && strtoupper($_GET['order']) === 'DESC') ? 'DESC' : 'ASC';

    // Use SQL ORDER BY for server-side sorting (recommended)
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY $key $order");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    jsonResponse(true, ['items' => $rows], 'OK', 200);

} catch (Exception $ex) {
    sendServerError($ex->getMessage());
}

?>
