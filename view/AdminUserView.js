document.addEventListener('DOMContentLoaded', function() {
    // Элементы страницы
    const adminContent = document.getElementById('adminContent');
    const accessDenied = document.getElementById('accessDenied');
    const usersTableContainer = document.getElementById('usersTableContainer');
    
    // Элементы модальных окон
    const userModal = document.getElementById('userModal');
    const deleteModal = document.getElementById('deleteModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const closeUserModal = document.getElementById('closeUserModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const userForm = document.getElementById('userForm');
    
    // Переменные для хранения состояния
    let currentUser = null;
    let userToDelete = null;
    
    // Проверяем, является ли пользователь администратором
    function checkAdminAccess() {
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            return false;
        }
        
        const user = JSON.parse(userData);
        return user.role === 'Администратор';
    }
    
    // Загружаем список пользователей
    async function loadUsers() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Ответ от сервера:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Ошибка загрузки пользователей');
        }
        
        // Проверяем структуру ответа
        if (!result.users) {
            throw new Error('Некорректный формат ответа от сервера');
        }
        
        renderUsersTable(result.users);
    } catch (error) {
        console.error('Ошибка:', error);
        usersTableContainer.innerHTML = `
            <div class="no-data">
                <p>Ошибка загрузки пользователей: ${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Повторить</button>
            </div>
        `;
    }
}
    
    // Отображаем таблицу пользователей
    function renderUsersTable(users) {
    // Проверяем, что users - массив
    if (!Array.isArray(users)) {
        console.error('Ошибка: users не является массивом:', users);
        usersTableContainer.innerHTML = `
            <div class="no-data">
                <p>Ошибка: получены некорректные данные</p>
                <button class="btn btn-primary" onclick="loadUsers()">Повторить</button>
            </div>
        `;
        return;
    }
    
    if (users.length === 0) {
        usersTableContainer.innerHTML = `
            <div class="no-data">
                <p>Пользователи не найдены</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table class="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Телефон</th>
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        // Проверяем структуру каждого пользователя
        if (!user || typeof user !== 'object') {
            console.warn('Некорректный пользователь:', user);
            return;
        }
        
        // Форматируем дату с проверкой
        let formattedDate = 'Не указана';
        if (user.created_at) {
            try {
                formattedDate = new Date(user.created_at).toLocaleDateString('ru-RU');
            } catch (e) {
                console.warn('Ошибка форматирования даты:', e);
            }
        }
        
        tableHTML += `
            <tr>
                <td>${user.id || 'N/A'}</td>
                <td>${user.name || 'Не указано'}</td>
                <td>${user.email || 'Не указан'}</td>
                <td>${user.phone || 'Не указан'}</td>
                <td>
                    <span class="role-badge ${(user.role === 'admin' || user.role === 'Администратор') ? 'role-admin' : 'role-user'}">
                        ${user.role === 'admin' || user.role === 'Администратор' ? 'Админ' : 'Пользователь'}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-warning btn-icon" onclick="editUser(${user.id || 0})">
                            Редактировать
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="confirmDeleteUser(${user.id || 0}, '${(user.name || 'Пользователь').replace(/'/g, "\\'")}')">
                            Удалить
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    usersTableContainer.innerHTML = tableHTML;
}
    
    // Открываем модальное окно для добавления пользователя
    function openAddUserModal() {
        currentUser = null;
        document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
        document.getElementById('passwordHint').style.display = 'inline';
        userForm.reset();
        userModal.style.display = 'flex';
    }
    
    // Открываем модальное окно для редактирования пользователя
    window.editUser = async function(userId) {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Данные пользователя для редактирования:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Ошибка загрузки данных пользователя');
        }
        
        if (!result.user) {
            throw new Error('Некорректный формат данных пользователя');
        }
        
        const user = result.user;
        currentUser = user;
        
        document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
        document.getElementById('passwordHint').style.display = 'inline';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role || 'user';
        document.getElementById('userPassword').value = '';
        
        userModal.style.display = 'flex';
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки данных пользователя: ' + error.message);
    }
}
    
    // Подтверждение удаления пользователя
    window.confirmDeleteUser = function(userId, userName) {
        userToDelete = userId;
        document.getElementById('deleteMessage').textContent = 
            `Вы действительно хотите удалить пользователя "${userName}"? Это действие нельзя отменить.`;
        deleteModal.style.display = 'flex';
    }
    
    // Сохранение пользователя
    async function saveUser() {
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            phone: document.getElementById('userPhone').value,
            role: document.getElementById('userRole').value
        };
        
        const password = document.getElementById('userPassword').value;
        if (password) {
            userData.password = password;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            let response;
            
            if (currentUser) {
                // Редактирование существующего пользователя
                response = await fetch(`/api/admin/users/${currentUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                // Добавление нового пользователя
                response = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Ошибка сохранения пользователя');
            }
            
            closeModal(userModal);
            loadUsers();
            showSuccessMessage(
                currentUser ? 
                'Пользователь успешно обновлен!' : 
                'Пользователь успешно добавлен!'
            );
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка сохранения пользователя: ' + error.message);
        }
    }
    
    // Удаление пользователя
    async function deleteUser() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/admin/users/${userToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка удаления пользователя');
            }
            
            closeModal(deleteModal);
            loadUsers();
            showSuccessMessage('Пользователь успешно удален!');
            userToDelete = null;
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка удаления пользователя: ' + error.message);
        }
    }
    
    // Вспомогательные функции
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    function showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = message;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    // Инициализация
    function initAdminPage() {
        if (!checkAdminAccess()) {
            adminContent.style.display = 'none';
            accessDenied.style.display = 'block';
            return;
        }
        
        // Загружаем пользователей
        loadUsers();
        
        // Назначаем обработчики событий
        addUserBtn.addEventListener('click', openAddUserModal);
        closeUserModal.addEventListener('click', () => closeModal(userModal));
        closeDeleteModal.addEventListener('click', () => closeModal(deleteModal));
        cancelUserBtn.addEventListener('click', () => closeModal(userModal));
        cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));
        saveUserBtn.addEventListener('click', saveUser);
        confirmDeleteBtn.addEventListener('click', deleteUser);
        
        // Закрытие модальных окон по клику на фон
        [userModal, deleteModal].forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
        
        // Отправка формы по Enter
        userForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveUserBtn.click();
            }
        });
    }
    
    initAdminPage();
});