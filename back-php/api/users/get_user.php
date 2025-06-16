<?php
// Получить пользователя по ID
$id = $_GET['id'] ?? null;
if (!$id) {
    sendError('Не указан id пользователя');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) {
        sendError('Пользователь не найден', 404);
    }
    sendResponse($user);
} catch (Exception $e) {
    sendError('Ошибка при получении пользователя: ' . $e->getMessage(), 500);
} 