<?php
// Run this script once to create sample users and projects (CLI or browser)
require_once __DIR__ . '/db.php';

try {
    $pdo = getPDO();

    // Create two users with hashed passwords
    $users = [
        ['name'=>'Alice Example','email'=>'alice@example.com','password'=>'password123'],
        ['name'=>'Bob Example','email'=>'bob@example.com','password'=>'password123'],
    ];

    foreach ($users as $u) {
        $hash = password_hash($u['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$u['name'], $u['email'], $hash]);
        $uid = (int)$pdo->lastInsertId();

        // add sample projects
        $projects = [
            ['title'=>'Project A for '.$u['name'], 'description'=>'Sample project', 'start_date'=>'2025-01-01', 'due_date'=>'2025-02-01', 'priority'=>3, 'status'=>'in-progress'],
            ['title'=>'Project B for '.$u['name'], 'description'=>'Sample project 2', 'start_date'=>'2025-03-01', 'due_date'=>'2025-04-01', 'priority'=>2, 'status'=>'todo'],
            ['title'=>'Project C for '.$u['name'], 'description'=>'Sample project 3', 'start_date'=>'2025-05-01', 'due_date'=>'2025-06-01', 'priority'=>1, 'status'=>'done'],
        ];
        $ins = $pdo->prepare('INSERT INTO projects (user_id, title, description, start_date, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        foreach ($projects as $p) $ins->execute([$uid, $p['title'], $p['description'], $p['start_date'], $p['due_date'], $p['priority'], $p['status']]);
    }

    echo "Seed complete.\n";
} catch (Exception $ex) {
    echo "Error: " . $ex->getMessage() . "\n";
}

?>
