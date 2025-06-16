<?php
// Обновить пользователя
$id = $_GET['id'] ?? null;
$name = $_GET['name'] ?? null;
$email = $_GET['email'] ?? null;
if (!$id || !$name || !$email) {
    sendError('Необходимо указать id, имя и email');
}
try {
    global $pdo;
    $stmt = $pdo->prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
    $stmt->execute([$name, $email, $id]);
    if ($stmt->rowCount() === 0) {
        sendError('Пользователь не найден', 404);
    }
    sendResponse(['id' => $id, 'name' => $name, 'email' => $email]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        sendError('Пользователь с таким email уже существует', 409);
    } else {
        sendError('Ошибка при обновлении пользователя: ' . $e->getMessage(), 500);
    }
} 