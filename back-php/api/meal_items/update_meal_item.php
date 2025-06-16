<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$id = $_GET['id'] ?? $_POST['id'] ?? null;
$amount = $_POST['amount'] ?? $_GET['amount'] ?? null;
$note = $_POST['note'] ?? $_GET['note'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id блюда']);
    exit;
}
if ($amount === null && $note === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Нет данных для обновления']);
    exit;
}
try {
    $stmt = $pdo->prepare('UPDATE meal_items SET amount = IFNULL(?, amount), note = IFNULL(?, note) WHERE id = ?');
    $stmt->execute([$amount, $note, $id]);
    echo json_encode(['id' => $id, 'amount' => $amount, 'note' => $note]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при обновлении блюда']);
} 