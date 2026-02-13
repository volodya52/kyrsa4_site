document.addEventListener('DOMContentLoaded', function () {
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
    const roleSelect = document.getElementById('userRole');

    // Initialize Controllers and Models
    const userController = new UserController();
    const userModel = new UserModel();

    // Переменные для хранения состояния
    let currentUser = null;
    let userToDelete = null;
    let rolesList = []; // Здесь будут храниться загруженные роли

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

            // Определяем роль для отображения
            let roleName = 'Клиент';
            let roleClass = 'role-user';
            
            if (user.role === 'admin' || user.role === 'Администратор' || user.role_id === 1) {
                roleName = 'Администратор';
                roleClass = 'role-admin';
            } else if (user.role === 'client' || user.role === 'Клиент' || user.role_id === 2) {
                roleName = 'Клиент';
                roleClass = 'role-user';
            }

            tableHTML += `
                <tr>
                    <td>${user.id || 'N/A'}</td>
                    <td>${user.name || 'Не указано'}</td>
                    <td>${user.email || 'Не указан'}</td>
                    <td>${user.phone || 'Не указан'}</td>
                    <td>
                        <span class="role-badge ${roleClass}">
                            ${roleName}
                        </span>
                    </td>
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

    // ЗАГРУЖАЕМ РОЛИ ТОЛЬКО ОДИН РАЗ
    async function loadRolesOnce() {
        if (rolesList.length > 0) {
            console.log('Роли уже загружены, используем кэш');
            return rolesList;
        }
        
        try {
            console.log('Загрузка ролей с сервера...');
            const roles = await userController.getRoles();
            
            if (roles && Array.isArray(roles) && roles.length > 0) {
                rolesList = roles;
            } else {
                // Запасной вариант
                rolesList = [
                    { id: 1, name: 'Администратор' },
                    { id: 2, name: 'Клиент' }
                ];
            }
            
            console.log('Роли загружены:', rolesList);
            return rolesList;
        } catch (error) {
            console.error('Ошибка загрузки ролей:', error);
            // Запасной вариант
            rolesList = [
                { id: 1, name: 'Администратор' },
                { id: 2, name: 'Клиент' }
            ];
            return rolesList;
        }
    }

    // Заполняем выпадающий список ролей (использует кэш)
    function populateRoleSelect(selectedRoleId = 2) {
        const roleSelect = document.getElementById('userRole');
        if (!roleSelect) return;

        // Очищаем select
        roleSelect.innerHTML = '';
        
        // Добавляем опции из кэша
        rolesList.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            if (role.id == selectedRoleId) {
                option.selected = true;
            }
            roleSelect.appendChild(option);
        });
        
        console.log('Список ролей заполнен, выбрана роль:', selectedRoleId);
    }

    // ИНИЦИАЛИЗАЦИЯ SELECT С РОЛЯМИ (вызывается 1 раз)
    async function initRoleSelect() {
        await loadRolesOnce(); // Загружаем роли один раз
        populateRoleSelect(2); // Устанавливаем "Клиент" по умолчанию
    }

    // Открываем модальное окно для добавления пользователя
    async function openAddUserModal() {
        try {
            currentUser = null;
            document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
            document.getElementById('passwordHint').style.display = 'inline';
            userForm.reset();
            
            // Сбрасываем ID пользователя
            const userIdInput = document.getElementById('userId');
            if (userIdInput) userIdInput.value = '';

            // Просто заполняем select из уже загруженных ролей (БЕЗ ЗАГРУЗКИ)
            populateRoleSelect(2); // Клиент по умолчанию

            userModal.style.display = 'flex';
        } catch (error) {
            console.error('Ошибка открытия модального окна:', error);
            alert('Ошибка: ' + error.message);
        }
    }

    // Открываем модальное окно для редактирования пользователя
    window.editUser = async function (userId) {
        try {
            const user = await userController.getUserById(userId);

            if (!user) {
                throw new Error('Некорректный формат данных пользователя');
            }

            currentUser = user;

            // Определяем ID роли
            let roleId = 2; // По умолчанию Клиент
            if (user.role_id) {
                roleId = user.role_id;
            } else if (user.role === 'admin' || user.role === 'Администратор') {
                roleId = 1;
            }

            // Заполняем select из уже загруженных ролей (БЕЗ ЗАГРУЗКИ)
            populateRoleSelect(roleId);

            document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
            document.getElementById('passwordHint').style.display = 'inline';
            document.getElementById('userId').value = user.id || '';
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
    window.confirmDeleteUser = function (userId, userName) {
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

        // Валидация
        if (!userData.name || !userData.email) {
            alert('Имя и Email обязательны для заполнения');
            return;
        }

        if (!currentUser && !userData.password) {
            alert('Пароль обязателен при создании нового пользователя');
            return;
        }

        try {
            const result = await userController.saveUser(userData, currentUser?.id || null);

            if (result.success) {
                closeModal(userModal);
                await loadUsers();
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
        if (!userToDelete) return;

        try {
            const result = await userController.deleteUser(userToDelete);

            if (result.success) {
                closeModal(deleteModal);
                await loadUsers();
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
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = message;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: fadeInOut 3s ease-in-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(successMsg);

        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
    }

    // Инициализация
    async function initAdminPage() {
        if (!checkAdminAccess()) {
            adminContent.style.display = 'none';
            accessDenied.style.display = 'block';
            return;
        }

        // ИНИЦИАЛИЗИРУЕМ SELECT С РОЛЯМИ (ЗАГРУЗКА ТОЛЬКО 1 РАЗ)
        await initRoleSelect();

        // Загружаем пользователей
        await loadUsers();

        // Назначаем обработчики событий
        addUserBtn.addEventListener('click', openAddUserModal);
        closeUserModal.addEventListener('click', () => closeModal(userModal));
        closeDeleteModal.addEventListener('click', () => closeModal(deleteModal));
        cancelUserBtn.addEventListener('click', () => closeModal(userModal));
        cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));
        saveUserBtn.addEventListener('click', saveUser);
        confirmDeleteBtn.addEventListener('click', deleteUser);

        // Закрытие модальных окон при клике вне их
        window.addEventListener('click', (event) => {
            if (event.target === userModal) {
                closeModal(userModal);
            }
            if (event.target === deleteModal) {
                closeModal(deleteModal);
            }
        });

        // Обработка нажатия Enter в форме
        if (userForm) {
            userForm.addEventListener('keypress', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveUserBtn.click();
                }
            });
        }
    }

    initAdminPage();
});