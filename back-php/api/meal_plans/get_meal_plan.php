<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id плана']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT mp.*, n.name as nutritionist_name FROM meal_plans mp LEFT JOIN nutritionists n ON mp.nutritionist_id = n.id WHERE mp.id = ?');
    $stmt->execute([$id]);
    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$plan) {
        http_response_code(404);
        echo json_encode(['error' => 'План питания не найден']);
        exit;
    }
    echo json_encode($plan);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении плана питания']);
} 