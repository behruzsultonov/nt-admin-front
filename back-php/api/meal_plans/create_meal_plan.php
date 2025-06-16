<?php
require_once __DIR__ . '/../../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$user_id = $_POST['user_id'] ?? $_GET['user_id'] ?? null;
$date = $_POST['date'] ?? $_GET['date'] ?? null;
if (!$user_id || !$date) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать ID пользователя и дату']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT id FROM meal_plans WHERE user_id = ? AND date = ?');
    $stmt->execute([$user_id, $date]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'План на эту дату уже существует']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO meal_plans (user_id, date) VALUES (?, ?)');
    $stmt->execute([$user_id, $date]);
    echo json_encode(['id' => $pdo->lastInsertId()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при создании плана питания']);
} 