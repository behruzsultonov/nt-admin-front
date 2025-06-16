<?php
require_once __DIR__ . '/../../config/database.php';

$userId = $_GET['user_id'] ?? null;
try {
    $query = 'SELECT mp.*, u.name as user_name FROM meal_plans mp LEFT JOIN users u ON mp.user_id = u.id';
    $params = [];
    if ($userId) {
        $query .= ' WHERE mp.user_id = ?';
        $params[] = $userId;
    }
    $query .= ' ORDER BY mp.date DESC';
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($plans);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении планов питания']);
} 