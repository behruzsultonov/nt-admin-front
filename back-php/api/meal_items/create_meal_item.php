<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$block_id = $_POST['block_id'] ?? $_GET['block_id'] ?? null;
$dish_id = $_POST['dish_id'] ?? $_GET['dish_id'] ?? null;
$amount = $_POST['amount'] ?? $_GET['amount'] ?? null;
$note = $_POST['note'] ?? $_GET['note'] ?? null;
if (!$block_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать ID блока']);
    exit;
}
if (!$amount) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать количество']);
    exit;
}
try {
    $stmt = $pdo->prepare('INSERT INTO meal_items (block_id, dish_id, amount, note) VALUES (?, ?, ?, ?)');
    $stmt->execute([$block_id, $dish_id ?: null, $amount, $note]);
    $id = $pdo->lastInsertId();
    http_response_code(201);
    echo json_encode(['id' => $id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при создании блюда']);
} 