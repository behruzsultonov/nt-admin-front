<?php
// Получить всех пользователей
try {
    global $pdo;
    $stmt = $pdo->query('SELECT * FROM users ORDER BY name');
    $users = $stmt->fetchAll();
    sendResponse($users);
} catch (Exception $e) {
    sendError('Ошибка при получении пользователей: ' . $e->getMessage(), 500);
} 