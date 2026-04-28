<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

// Projects endpoint handling multiple methods
// GET /api/projects.php?sortField=priority&sortOrder=DESC&page=1&perPage=20
// GET /api/projects.php?id=123  -> single project
// POST -> create project (JSON body)
// PUT -> update project (JSON body, requires id)
// DELETE -> delete project (requires id)

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    // CORS preflight if needed
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

try {
    $userId = requireAuth();
    $pdo = getPDO();

    if ($method === 'GET') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ? AND user_id = ? LIMIT 1');
            $stmt->execute([$id, $userId]);
            $proj = $stmt->fetch();
            if (!$proj) jsonResponse(false, null, 'Not found', 404);
            jsonResponse(true, $proj, 'OK', 200);
        }

        // list
        $sortField = in_array($_GET['sortField'] ?? '', ['priority','due_date','start_date','title']) ? $_GET['sortField'] : 'start_date';
        $sortOrder = (isset($_GET['sortOrder']) && strtoupper($_GET['sortOrder']) === 'DESC') ? 'DESC' : 'ASC';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = max(1, min(200, (int)($_GET['perPage'] ?? 50)));
        $offset = ($page - 1) * $perPage;

        $allowedFields = ['priority','due_date','start_date','title'];
        $orderClause = in_array($sortField, $allowedFields) ? "$sortField $sortOrder" : 'start_date ASC';

        $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY $orderClause LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $perPage, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        jsonResponse(true, ['items' => $rows, 'page' => $page, 'perPage' => $perPage], 'OK', 200);
    }

    if ($method === 'POST') {
        $data = getJsonInput();
        $title = trim($data['title'] ?? '');
        if (!$title) jsonResponse(false, null, 'Title required', 400);
        $description = $data['description'] ?? '';
        $start_date = $data['start_date'] ?? null;
        $due_date = $data['due_date'] ?? null;
        $priority = isset($data['priority']) ? (int)$data['priority'] : 0;
        $status = $data['status'] ?? 'todo';
        $tags = $data['tags'] ?? null;

        $ins = $pdo->prepare('INSERT INTO projects (user_id, title, description, start_date, due_date, priority, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $ins->execute([$userId, $title, $description, $start_date, $due_date, $priority, $status, $tags]);
        $newId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ? LIMIT 1');
        $stmt->execute([$newId]);
        $proj = $stmt->fetch();
        jsonResponse(true, $proj, 'Project created', 201);
    }

    // Support PUT/DELETE where client sends method override via X-HTTP-Method-Override or _method
    $input = getJsonInput();
    $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? ($input['_method'] ?? null);
    if ($override) $method = strtoupper($override);

    if ($method === 'PUT') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        if (!$id) jsonResponse(false, null, 'Missing id', 400);
        // check ownership
        $stmt = $pdo->prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) jsonResponse(false, null, 'Not found', 404);

        $fields = [];
        $params = [];
        foreach (['title','description','start_date','due_date','priority','status','tags'] as $f) {
            if (array_key_exists($f, $input)) {
                $fields[] = "$f = ?";
                $params[] = $input[$f];
            }
        }
        if (empty($fields)) jsonResponse(false, null, 'No fields to update', 400);
        $params[] = $id;
        $upd = $pdo->prepare('UPDATE projects SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $upd->execute($params);
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        jsonResponse(true, $stmt->fetch(), 'Updated', 200);
    }

    if ($method === 'DELETE') {
        // support id via query or body
        $id = isset($_GET['id']) ? (int)$_GET['id'] : (int)($input['id'] ?? 0);
        if (!$id) jsonResponse(false, null, 'Missing id', 400);
        $stmt = $pdo->prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if ($stmt->rowCount() === 0) jsonResponse(false, null, 'Not found or not allowed', 404);
        jsonResponse(true, null, 'Deleted', 200);
    }

    jsonResponse(false, null, 'Method not allowed', 405);

} catch (Exception $ex) {
    sendServerError($ex->getMessage());
}

?>
