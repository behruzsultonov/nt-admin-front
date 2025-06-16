<?php
header('Content-Type: application/json');

// Проверяем наличие файла
if (!isset($_FILES['image'])) {
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

// Информация о загрузке
$uploadInfo = [
    'php_version' => PHP_VERSION,
    'max_upload_size' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'file_info' => $_FILES['image']
];

// Проверяем ошибки загрузки
if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'error' => 'Upload error',
        'error_code' => $_FILES['image']['error'],
        'info' => $uploadInfo
    ]);
    exit;
}

// Пробуем создать директорию
$uploadDir = '/var/www/html/nt-admin/uploads/';
$dirInfo = [
    'path' => $uploadDir,
    'exists' => file_exists($uploadDir),
    'is_writable' => is_writable($uploadDir),
    'php_user' => exec('whoami'),
    'current_script_path' => __FILE__,
    'document_root' => $_SERVER['DOCUMENT_ROOT']
];

if (!file_exists($uploadDir)) {
    $dirInfo['mkdir_result'] = mkdir($uploadDir, 0777, true);
    if ($dirInfo['mkdir_result']) {
        chmod($uploadDir, 0777); // Установим права после создания
    }
}

// Пробуем загрузить файл
$filename = time() . '-test.' . pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
$uploadFile = $uploadDir . $filename;

$result = move_uploaded_file($_FILES['image']['tmp_name'], $uploadFile);

if ($result) {
    chmod($uploadFile, 0666); // Установим права на загруженный файл
}

echo json_encode([
    'success' => $result,
    'file_path' => $result ? '/uploads/' . $filename : null,
    'full_path' => $uploadFile,
    'directory_info' => $dirInfo,
    'upload_info' => $uploadInfo
]); 