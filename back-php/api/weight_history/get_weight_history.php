<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать ID пользователя']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT weight, recorded_at FROM weight_history WHERE user_id = ? ORDER BY recorded_at DESC');
    $stmt->execute([$user_id]);
    $weights = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($weights);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении истории веса']);
} 