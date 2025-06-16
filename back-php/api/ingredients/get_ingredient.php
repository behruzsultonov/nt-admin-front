<?php
// Получить ингредиент по ID
$id = $_GET['id'] ?? null;
if (!$id) {
    sendError('Не указан id ингредиента');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('SELECT id, name, calories_per_100, proteins_per_100, fats_per_100, carbs_per_100 FROM ingredients WHERE id = ?');
    $stmt->execute([$id]);
    $ingredient = $stmt->fetch();
    if (!$ingredient) {
        sendError('Ингредиент не найден', 404);
    }
    sendResponse($ingredient);
} catch (Exception $e) {
    sendError('Ошибка при получении ингредиента: ' . $e->getMessage(), 500);
} 