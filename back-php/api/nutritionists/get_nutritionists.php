<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query('SELECT id, email, name FROM nutritionists');
    $nutritionists = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($nutritionists);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при получении списка нутрициологов']);
} 