<?php
require_once __DIR__ . '/../../config/database.php';
$id = $_GET['id'] ?? $_POST['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Не указан id блока']);
    exit;
}
try {
    $pdo->beginTransaction();
    
    // First delete all meal items associated with this block
    $stmt = $pdo->prepare('DELETE FROM meal_items WHERE block_id = ?');
    $stmt->execute([$id]);
    
    // Then delete the block itself
    $stmt = $pdo->prepare('DELETE FROM meal_blocks WHERE id = ?');
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['error' => 'Блок питания не найден']);
        exit;
    }
    
    $pdo->commit();
    echo json_encode(['message' => 'Блок питания успешно удален']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Error deleting meal block: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка при удалении блока питания: ' . $e->getMessage()]);
} 