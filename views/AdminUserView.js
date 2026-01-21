// AdminUserView.js - UPDATED FOR MVC
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
    
    // Initialize Controllers and Models
    const userController = new UserController();
    const userModel = new UserModel();
    
    // Переменные для хранения состояния
    let currentUser = null;
    let userToDelete = null;
    
    // Проверяем, является ли пользователь администратором через модель
    function checkAdminAccess() {
        return userModel.isAdmin();
    }
    
    // Загружаем список пользователей
    async function loadUsers() {
        try {
            const users = await userController.getUsers();
            renderUsersTable(users);
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
    async function openAddUserModal() {
        try {
            currentUser = null;
            document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
            document.getElementById('passwordHint').style.display = 'inline';
            userForm.reset();
            
            // Загружаем и заполняем список ролей
            const roles = await userController.getRoles();
            const roleSelect = document.getElementById('userRole');
            
            if (roles) {
                roleSelect.innerHTML = '';
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = role.name;
                    roleSelect.appendChild(option);
                });
            } else {
                // Запасной вариант
                roleSelect.innerHTML = `
                    <option value="2">Клиент</option>
                    <option value="1">Администратор</option>
                `;
            }
            
            userModal.style.display = 'flex';
        } catch (error) {
            console.error('Ошибка открытия модального окна:', error);
            alert('Ошибка: ' + error.message);
        }
    }
    
    // Открываем модальное окно для редактирования пользователя
    window.editUser = async function(userId) {
        try {
            const user = await userController.getUserById(userId);
            
            if (!user) {
                throw new Error('Некорректный формат данных пользователя');
            }
            
            currentUser = user;
            
            // Загружаем роли для select
            const roles = await userController.getRoles();
            const roleSelect = document.getElementById('userRole');
            
            if (roles) {
                roleSelect.innerHTML = '';
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = role.name;
                    if (user.role_id == role.id || user.role === role.name) {
                        option.selected = true;
                    }
                    roleSelect.appendChild(option);
                });
            } else {
                // Запасной вариант
                roleSelect.innerHTML = `
                    <option value="2" ${(user.role_id == 2 || user.role === 'Клиент') ? 'selected' : ''}>Клиент</option>
                    <option value="1" ${(user.role_id == 1 || user.role === 'Администратор') ? 'selected' : ''}>Администратор</option>
                `;
            }
            
            document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
            document.getElementById('passwordHint').style.display = 'inline';
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.name || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userPhone').value = user.phone || '';
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
            phone: document.getElementById('userPhone').value || '',
            role_id: parseInt(document.getElementById('userRole').value)
        };
        
        const password = document.getElementById('userPassword').value;
        if (password) {
            userData.password = password;
        }
        
        try {
            const result = await userController.saveUser(userData, currentUser?.id || null);
            
            if (result.success) {
                closeModal(userModal);
                loadUsers();
                showSuccessMessage(
                    currentUser ? 
                    'Пользователь успешно обновлен!' : 
                    'Пользователь успешно добавлен!'
                );
            } else {
                throw new Error(result.error || 'Ошибка сохранения пользователя');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка сохранения пользователя: ' + error.message);
        }
    }
    
    // Удаление пользователя
    async function deleteUser() {
        try {
            const result = await userController.deleteUser(userToDelete);
            
            if (result.success) {
                closeModal(deleteModal);
                loadUsers();
                showSuccessMessage('Пользователь успешно удален!');
                userToDelete = null;
            } else {
                throw new Error(result.error || 'Ошибка удаления пользователя');
            }
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