<?php
// Получить все ингредиенты
try {
    global $pdo;
    $stmt = $pdo->query('SELECT id, name, calories_per_100, proteins_per_100, fats_per_100, carbs_per_100 FROM ingredients ORDER BY name');
    $ingredients = $stmt->fetchAll();
    sendResponse($ingredients);
} catch (Exception $e) {
    sendError('Ошибка при получении ингредиентов: ' . $e->getMessage(), 500);
} 