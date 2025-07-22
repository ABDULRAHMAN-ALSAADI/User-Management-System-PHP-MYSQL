<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch($method) {
    case 'GET':
        if($action == 'getUsers') {
            getUsers($conn);
        }
        break;
        
    case 'POST':
        if($action == 'addUser') {
            addUser($conn);
        }
        break;
        
    case 'PUT':
        if($action == 'toggleStatus') {
            toggleStatus($conn);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getUsers($conn) {
    $sql = "SELECT id, name, age, status FROM users ORDER BY id DESC";
    $result = $conn->query($sql);
    
    $users = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'age' => $row['age'],
                'status' => $row['status'] == 1 ? 'active' : 'inactive'
            ];
        }
    }
    
    echo json_encode($users);
}

function addUser($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = isset($input['name']) ? trim($input['name']) : '';
    $age = isset($input['age']) ? intval($input['age']) : 0;
    
    if (empty($name) || $age <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and valid age are required']);
        return;
    }
    
    $stmt = $conn->prepare("INSERT INTO users (name, age, status) VALUES (?, ?, 0)");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
        return;
    }
    
    $stmt->bind_param("si", $name, $age);
    
    if ($stmt->execute()) {
        $newId = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'id' => $newId,
            'name' => $name,
            'age' => $age,
            'status' => 'inactive'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add user: ' . $stmt->error]);
    }
    
    $stmt->close();
}

function toggleStatus($conn) {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = isset($input['id']) ? intval($input['id']) : 0;
    
    if($userId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid user ID is required']);
        return;
    }
    
    // Get current status
    $stmt = $conn->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if($result->num_rows == 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    $row = $result->fetch_assoc();
    $newStatus = $row['status'] == 1 ? 0 : 1;
    
    // Update status
    $updateStmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
    $updateStmt->bind_param("ii", $newStatus, $userId);
    
    if($updateStmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $userId,
            'status' => $newStatus == 1 ? 'active' : 'inactive'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update status']);
    }
    
    $stmt->close();
    $updateStmt->close();
}

$conn->close();
?>