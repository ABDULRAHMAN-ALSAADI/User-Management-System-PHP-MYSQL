let users = [];

// Load users when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    document.getElementById('name').focus();
});

// Form submission
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const age = parseInt(document.getElementById('age').value);
    
    if (name && age) {
        addUser(name, age);
    }
});

// Load users from database
async function loadUsers() {
    try {
        const response = await fetch('api.php?action=getUsers');
        const data = await response.json();
        
        if (Array.isArray(data)) {
            users = data;
            updateTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users from database');
    }
}

// Add new user to database
async function addUser(name, age) {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    // Validate input
    if (!name.trim()) {
        showError('Name cannot be empty');
        return;
    }
    if (age <= 0 || isNaN(age)) {
        showError('Age must be a positive number');
        return;
    }
    
    try {
        submitBtn.textContent = 'Adding...';
        submitBtn.disabled = true;
        
        console.log('Sending data:', { name, age });
        
        const response = await fetch('api.php?action=addUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, age })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            document.getElementById('name').value = '';
            document.getElementById('age').value = '';
            loadUsers();
            submitBtn.textContent = 'Added!';
            submitBtn.style.background = 'linear-gradient(135deg, #748D92 0%, #124E66 100%)';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = 'linear-gradient(135deg, #748D92 0%, #124E66 100%)';
                submitBtn.disabled = false;
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to add user');
        }
    } catch (error) {
        console.error('Error adding user:', error.message, error.stack);
        showError('Failed to add user: ' + error.message);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function toggleStatus(userId) {
    try {
        const response = await fetch('api.php?action=toggleStatus', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId })
        });

        const data = await response.json();

        if (data.success) {
            // Update local user data with numeric status
            const user = users.find(u => u.id === userId);
            if (user) {
                user.status = data.status === 'active' ? 1 : 0;
                updateTable();
            }
        } else {
            throw new Error(data.error || 'Failed to toggle status');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showError('Failed to toggle status: ' + error.message);
    }
}

// Update the table display
function updateTable() {
    const tableBody = document.getElementById('tableBody');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">No users found in database. Add some users to get started!</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.age}</td>
            <td>
                <span class="status ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
            </td>
            <td>
                <button class="toggle-btn" onclick="toggleStatus(${user.id})">
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Show error message
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    // Add slide in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
        style.remove();
    }, 5000);
}