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
if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Необходимо указать email и пароль']);
    exit;
}
try {
    $stmt = $pdo->prepare('SELECT id, email, name FROM nutritionists WHERE email = ? AND password = ?');
    $stmt->execute([$email, $password]);
    $nutritionist = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$nutritionist) {
        http_response_code(401);
        echo json_encode(['error' => 'Неверный email или пароль']);
        exit;
    }
    echo json_encode($nutritionist);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при входе в систему']);
} 