<?php

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Файл не получен']);
    exit;
}

// Проверяем ошибки загрузки
if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE => 'Размер файла превышает upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'Размер файла превышает MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL => 'Файл был загружен частично',
        UPLOAD_ERR_NO_FILE => 'Файл не был загружен',
        UPLOAD_ERR_NO_TMP_DIR => 'Отсутствует временная папка',
        UPLOAD_ERR_CANT_WRITE => 'Не удалось записать файл на диск',
        UPLOAD_ERR_EXTENSION => 'PHP-расширение остановило загрузку файла',
    ];
    
    $errorMessage = isset($uploadErrors[$_FILES['image']['error']]) 
        ? $uploadErrors[$_FILES['image']['error']] 
        : 'Неизвестная ошибка загрузки';
    
    http_response_code(400);
    echo json_encode(['error' => $errorMessage]);
    exit;
}

// Проверяем тип файла
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$fileInfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($fileInfo, $_FILES['image']['tmp_name']);
finfo_close($fileInfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Недопустимый тип файла. Разрешены только JPEG, PNG и GIF']);
    exit;
}

$uploadDir = dirname(dirname(dirname(__FILE__))) . '/uploads/chat/';

// Проверяем и создаем директорию если нужно
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Не удалось создать директорию для загрузки']);
        exit;
    }
}

// Устанавливаем права на директорию
chmod($uploadDir, 0777);

// Проверяем права на запись
if (!is_writable($uploadDir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Нет прав на запись в директорию']);
    exit;
}

// Генерируем уникальное имя файла
$extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
$filename = time() . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
$uploadFile = $uploadDir . $filename;

// Пробуем переместить файл
if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile)) {
    // Устанавливаем права на файл
    chmod($uploadFile, 0644);
    
    // Возвращаем URL относительно корня сайта
    echo json_encode([
        'url' => 'https://sadoapp.tj/nt-admin/uploads/chat/' . $filename,
        'success' => true
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка сохранения файла']);
} 