document.addEventListener('DOMContentLoaded', function() {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const signinLinks = document.querySelectorAll('#signinLink, .nav-menu a[href="signin.html"]');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    const showRegisterModalLink = document.getElementById('showRegisterModalLink');
    const showLoginModalLink = document.getElementById('showLoginModalLink');
    const confirmLoginBtn = document.getElementById('confirmLoginBtn');
    const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
    
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Обработчики для открытия модальных окон (только для неавторизованных пользователей)
    signinLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Проверяем, авторизован ли пользователь
            const userData = localStorage.getItem('user_data');
            
            if (userData) {
                // Если пользователь авторизован - переходим на профиль
                const user = JSON.parse(userData);
                window.location.href = 'profile.html';
            } else {
                // Если не авторизован - открываем окно входа
                openModal(loginModal);
            }
        });
    });
    
    // Закрытие модальных окон
    closeLoginModal.addEventListener('click', () => closeModal(loginModal));
    closeRegisterModal.addEventListener('click', () => closeModal(registerModal));
    cancelLoginBtn.addEventListener('click', () => closeModal(loginModal));
    cancelRegisterBtn.addEventListener('click', () => closeModal(registerModal));
    
    // Переключение между модальными окнами
    showRegisterModalLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(loginModal);
        openModal(registerModal);
    });
    
    showLoginModalLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });
    
    // Валидация форм
    function validateLoginForm() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        let isValid = true;
    
        document.getElementById('loginEmailError').textContent = '';
        document.getElementById('loginPasswordError').textContent = '';
        
        if (!email) {
            document.getElementById('loginEmailError').textContent = 'Введите email';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('loginEmailError').textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('loginPasswordError').textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('loginPasswordError').textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateRegisterForm() {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        let isValid = true;
        
        document.getElementById('regNameError').textContent = '';
        document.getElementById('regPhoneError').textContent = '';
        document.getElementById('regEmailError').textContent = '';
        document.getElementById('regPasswordError').textContent = '';
        document.getElementById('regConfirmPasswordError').textContent = '';
        
        if (!name) {
            document.getElementById('regNameError').textContent = 'Введите имя';
            isValid = false;
        }
        
        if (!email) {
            document.getElementById('regEmailError').textContent = 'Введите email';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('regEmailError').textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('regPasswordError').textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('regPasswordError').textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }
        
        if (!confirmPassword) {
            document.getElementById('regConfirmPasswordError').textContent = 'Подтвердите пароль';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('regConfirmPasswordError').textContent = 'Пароли не совпадают';
            isValid = false;
        }
        
        if (!phone) {
            document.getElementById('regPhoneError').textContent = 'Введите номер телефона';
            isValid = false;
        } else if (phone.length < 11 || phone.length > 12) {
            document.getElementById('regPhoneError').textContent = 'Длина номера должна быть от 11 до 12 цифр';
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
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
    
    // Вход пользователя
    confirmLoginBtn.addEventListener('click', async function() {
        if (!validateLoginForm()) return;
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const result = await loginUser(email, password);
            
            if (result.success) {
                closeModal(loginModal);
                showSuccessMessage('Вы успешно вошли в систему!');
                
                // Сохраняем данные пользователя
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));
                
                // Обновляем интерфейс
                updateUIAfterLogin(result.user);
                
                // Перенаправляем на профиль
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1000);
            } else {
                document.getElementById('loginPasswordError').textContent = result.error;
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            document.getElementById('loginPasswordError').textContent = 'Ошибка входа. Попробуйте снова.';
        }
    });
    
    // Регистрация пользователя
    confirmRegisterBtn.addEventListener('click', async function() {
        if (!validateRegisterForm()) return;
        
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        try {
            const result = await registerUser(name, phone, email, password);
            
            if (result.success) {
                closeModal(registerModal);
                showSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
                
                // Автоматически входим после регистрации
                const loginResult = await loginUser(email, password);
                
                if (loginResult.success) {
                    localStorage.setItem('auth_token', loginResult.token);
                    localStorage.setItem('user_data', JSON.stringify(loginResult.user));
                    
                    updateUIAfterLogin(loginResult.user);
                    
                    // Перенаправляем на профиль
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                }
            } else {
                document.getElementById('regEmailError').textContent = result.error;
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            document.getElementById('regEmailError').textContent = 'Ошибка регистрации. Попробуйте снова.';
        }
    });
    
    // Обработка Enter в формах
    document.getElementById('loginEmail').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmLoginBtn.click();
        }
    });
    
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmLoginBtn.click();
        }
    });
    
    document.getElementById('regConfirmPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmRegisterBtn.click();
        }
    });
    
    // API функции
    async function loginUser(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { 
                    success: false, 
                    error: data.error || 'Ошибка входа' 
                };
            }
            
            return { 
                success: true, 
                token: data.token, 
                user: data.user 
            };
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            return { 
                success: false, 
                error: 'Ошибка соединения с сервером' 
            };
        }
    }
    
    async function registerUser(name, phone, email, password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { 
                    success: false, 
                    error: data.error || 'Ошибка регистрации' 
                };
            }
            
            return { 
                success: true, 
                data: data 
            };
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            return { 
                success: false, 
                error: 'Ошибка соединения с сервером' 
            };
        }
    }
    
    // Функции управления интерфейсом
    function updateUIAfterLogin(user) {
        updateUIForLoggedInUser(user);
    }
    
    function updateUIForLoggedInUser(user) {
        const signinLink = document.getElementById('signinLink');
        if (signinLink) {
            // Обновляем ссылку на профиль
            signinLink.textContent = user.name;
            signinLink.href = 'profile.html';
            
            // Убираем старый обработчик и добавляем новый для перехода на профиль
            signinLink.onclick = function(e) {
                // Не отменяем действие по умолчанию - переход по ссылке
                // e.preventDefault(); // УБИРАЕМ эту строку!
            };
            
            // Обновляем навигацию для администратора
            updateNavigationForRole(user.role);
        }
    }
    
    function updateNavigationOnLogout() {
        const signinLink = document.getElementById('signinLink');
        if (signinLink) {
            // Возвращаем ссылку "Войти" с открытием модального окна
            signinLink.textContent = 'Войти';
            signinLink.href = '#';
            signinLink.onclick = function(e) {
                e.preventDefault();
                openModal(loginModal);
            };
            
            // Скрываем ссылку "Пользователи" для админов
            const usersLink = document.querySelector('#navMenu a[href="users.html"]');
            if (usersLink && usersLink.closest('li')) {
                usersLink.closest('li').remove();
            }
        }
    }
    
    function updateNavigationForRole(role) {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;
        
        const usersLink = document.querySelector('#navMenu a[href="users.html"]');
        
        if (role === 'Администратор') {
            // Если ссылки "Пользователи" нет - добавляем
            if (!usersLink) {
                const usersItem = document.createElement('li');
                usersItem.innerHTML = '<a href="users.html">Пользователи</a>';
                
                // Находим элемент "Войти" и добавляем перед ним
                const signinItem = document.querySelector('#navMenu li:has(#signinLink)');
                if (signinItem) {
                    signinItem.parentNode.insertBefore(usersItem, signinItem);
                } else {
                    // Если не нашли, добавляем в конец
                    navMenu.appendChild(usersItem);
                }
            }
        } else {
            // Если пользователь не админ - удаляем ссылку "Пользователи"
            if (usersLink && usersLink.closest('li')) {
                usersLink.closest('li').remove();
            }
        }
    }
    
    // Выход из системы (вызывается только из профиля)
    window.logoutUser = function() {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            fetch('/api/logout', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            }).catch(error => {
                console.error('Ошибка при выходе:', error);
            });
        }
        
        // Очищаем localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Обновляем навигацию
        updateNavigationOnLogout();
        
        // Перенаправляем на главную страницу
        window.location.href = 'index.html';
    };
    
    // Проверка авторизации при загрузке страницы
    function checkAuth() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
    
        if (token && userData) {
            const user = JSON.parse(userData);
            
            // Обновляем интерфейс
            updateUIForLoggedInUser(user);
            updateNavigationForRole(user.role);
            updateAllUserLinks(user.role);
            
            // Проверяем валидность токена на сервере
            fetch('/api/user', {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            })
            .then(response => {
                if (!response.ok) {
                    // Токен невалидный, удаляем из localStorage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    updateNavigationOnLogout();
                }
            })
            .catch(() => {
                // Ошибка соединения, но оставляем пользователя
                console.warn('Ошибка проверки токена, но пользователь остается авторизованным');
            });
        } else {
            // Если пользователь не авторизован, убеждаемся что навигация корректна
            updateNavigationOnLogout();
        }
    }
    
    // Глобальные функции для работы с избранным
    window.addToFavorites = function(carId) {
        if (!localStorage.getItem('auth_token')) {
            alert('Для добавления в избранное необходимо войти в систему');
            openModal(loginModal);
            return false;
        }
        
        const userData = localStorage.getItem('user_data');
        if (!userData) return false;
        
        const user = JSON.parse(userData);
        
        // Получаем текущие избранные автомобили из localStorage
        let favorites = JSON.parse(localStorage.getItem(`favorites_${user.id}`)) || [];
        
        // Проверяем, есть ли уже в избранном
        if (favorites.includes(carId)) {
            alert('Этот автомобиль уже в избранном');
            return false;
        }
        
        // Добавляем в избранное
        favorites.push(carId);
        localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
        
        // Пробуем сохранить на сервере
        saveFavoriteToServer(carId);
        
        alert('Автомобиль добавлен в избранное!');
        return true;
    };
    
    // Сохранение избранного на сервере
    async function saveFavoriteToServer(carId) {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        try {
            const response = await fetch('/api/user/favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ carId })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Ошибка сохранения избранного на сервер:', error);
            return false;
        }
    }


    function updateNavigationForRole(role) {
    const usersTabItem = document.getElementById('usersTabItem');
    const carsTabItem=document.getElementById('carsTabItem');
    
    if (usersTabItem) {
        if (role === 'Администратор') {
            usersTabItem.style.display = 'block';
        } else {
            usersTabItem.style.display = 'none';
        }
    }

    if(carsTabItem){
        if(role==='Администратор'){
            carsTabItem.style.display='block';
        }else{
            carsTabItem.style.display='none';
        }
    }


}

function updateAllUserLinks(role) {
    const isAdmin = role === 'Администратор';
    const selectors = [
        '#usersTabItem',
        '#adminUsersLink',
        '.nav-menu a[href="users.html"]'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const li = element.closest('li') || element;
            if (isAdmin) {
                li.style.display = 'block';
            } else {
                li.style.display = 'none';
            }
        });
    });
}
    async function updateNav() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Не авторизован
        showTabItems(false, false, false);
        return;
    }
    
    try {
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                const user = data.user;
                
                // Проверка роли (несколько возможных вариантов)
                const isAdmin = user.role === 'Администратор' || 
                               user.role === 'admin' || 
                               user.role === 'Administrator' ||
                               user.role_id === 1;
                
                // Отображаем соответствующие пункты меню
                showTabItems(isAdmin, isAdmin, isAdmin);
                const newsTabItem = document.getElementById('newsTabItem');
if (newsTabItem && user.role === 'Администратор') {
    newsTabItem.style.display = 'block';
} else if (newsTabItem) {
    newsTabItem.style.display = 'none';
}
                
                // Обновляем кнопку входа/выхода
                const signinLink = document.getElementById('signinLink');
                if (signinLink) {
                    signinLink.textContent = 'Выйти';
                    signinLink.href = '#';
                    signinLink.onclick = logoutUser;
                }
            } else {
                // Не удалось получить данные пользователя
                localStorage.removeItem('token');
                showTabItems(false, false, false);
            }
        } else {
            // Ошибка авторизации
            localStorage.removeItem('token');
            showTabItems(false, false, false);
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        localStorage.removeItem('token');
        showTabItems(false, false, false);
    }
}
    function showTabItems(showCars, showUsers, showNews) {
    const carsTabItem = document.getElementById('carsTabItem');
    const usersTabItem = document.getElementById('usersTabItem');
    const newsTabItem = document.getElementById('newsTabItem');
    
    if (carsTabItem) {
        carsTabItem.style.display = showCars ? 'block' : 'none';
    }
    
    if (usersTabItem) {
        usersTabItem.style.display = showUsers ? 'block' : 'none';
    }
    
    if (newsTabItem) {
        newsTabItem.style.display = showNews ? 'block' : 'none';
    }
    }

    // Вызов при загрузке страницы
    document.addEventListener('DOMContentLoaded', updateNav);
    
    
    checkAuth();
});