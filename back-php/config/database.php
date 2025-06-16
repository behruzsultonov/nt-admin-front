<?php
function getDbConnection() {
    $host = 'k98108ya.beget.tech';
    $db   = 'k98108ya_ntadmin'; // замените на вашу БД
    $user = 'k98108ya_ntadmin'; // замените на вашего пользователя
    $pass = '!0r6oC2txTr&';
    $charset = 'utf8mb4';
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB connection failed', 'details' => $e->getMessage()]);
        exit;
    }
} 