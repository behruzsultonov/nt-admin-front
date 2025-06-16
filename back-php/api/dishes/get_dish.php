<?php
// Получить блюдо по ID
$id = $_GET['id'] ?? null;
if (!$id) {
    sendError('Не указан id блюда');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM dishes WHERE id = ?');
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) {
        sendError('Блюдо не найдено', 404);
    }
    sendResponse($dish);
} catch (Exception $e) {
    sendError('Ошибка при получении блюда: ' . $e->getMessage(), 500);
} 