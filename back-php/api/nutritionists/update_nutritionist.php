<?php
require_once __DIR__ . '/../../config/database.php';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}
$id = $_GET['id'] ?? $_POST['id'] ?? null;
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? null;
$password = $input['password'] ?? null;
$name = $input['name'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id']);
    exit;
}
if ($email === null && $password === null && $name === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Нет данных для обновления']);
    exit;
}
try {
    $fields = [];
    $params = [];
    if ($email !== null) { $fields[] = 'email = ?'; $params[] = $email; }
    if ($password !== null) { $fields[] = 'password = ?'; $params[] = $password; }
    if ($name !== null) { $fields[] = 'name = ?'; $params[] = $name; }
    $params[] = $id;
    $sql = 'UPDATE nutritionists SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['id' => $id, 'email' => $email, 'name' => $name]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при обновлении нутрициолога']);
} 