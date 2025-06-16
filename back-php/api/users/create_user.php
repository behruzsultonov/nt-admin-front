<?php
// Создать пользователя
$name = $_GET['name'] ?? null;
$email = $_GET['email'] ?? null;
if (!$name || !$email) {
    sendError('Необходимо указать имя и email');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    $stmt->execute([$name, $email]);
    $id = $pdo->lastInsertId();
    sendResponse(['id' => $id, 'name' => $name, 'email' => $email], 201);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        sendError('Пользователь с таким email уже существует', 409);
    } else {
        sendError('Ошибка при создании пользователя: ' . $e->getMessage(), 500);
    }
} 