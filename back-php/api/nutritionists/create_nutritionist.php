<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? null;
$password = $input['password'] ?? null;
$name = $input['name'] ?? null;
if (!$email || !$password || !$name) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать email, пароль и имя']);
    exit;
}
try {
    $stmt = $pdo->prepare('INSERT INTO nutritionists (email, password, name) VALUES (?, ?, ?)');
    $stmt->execute([$email, $password, $name]);
    echo json_encode(['id' => $pdo->lastInsertId(), 'email' => $email, 'name' => $name]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при создании нутрициолога']);
} 