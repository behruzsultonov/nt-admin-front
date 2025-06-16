<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
$date = $_GET['date'] ?? $_POST['date'] ?? null;
if (!$user_id || !$date) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать ID пользователя и дату']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT weight, recorded_at FROM weight_history WHERE user_id = ? AND recorded_at < ? ORDER BY recorded_at DESC LIMIT 1');
    $stmt->execute([$user_id, $date]);
    $weight = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$weight) {
        http_response_code(404);
        echo json_encode(['error' => 'Записи о весе не найдены']);
        exit;
    }
    echo json_encode($weight);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении последнего веса']);
} 