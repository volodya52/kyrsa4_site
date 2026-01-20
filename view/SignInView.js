// view/SignInView.js - ИСПРАВЛЕННЫЙ
class SignInView {
    constructor() {
        console.log('SignInView initializing...');
        
        this.token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        this.user = null;
        
        // Элементы модальных окон
        this.modals = {
            login: null,
            register: null
        };
        
        this.init();
    }
    
    init() {
        console.log('Initializing SignInView...');
        
        // Ждем полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            setTimeout(() => this.setup(), 100);
        }
    }
    
    async setup() {
        console.log('Setting up SignInView...');
        
        // Находим элементы
        this.signinLinks = document.querySelectorAll('#signinLink, .nav-menu a[href="signin.html"]');
        this.modals.login = document.getElementById('loginModal');
        this.modals.register = document.getElementById('registerModal');
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Проверяем состояние авторизации
        await this.checkAuthState();
        
        // Проверяем валидность токена на сервере
        await this.validateToken();
    }
    
    setupEventListeners() {
        // Обработчики для ссылок входа
        this.signinLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleSignInClick(e, link));
        });
        
        // Обработчики для модальных окон (если они есть в DOM)
        this.setupModalListeners();
        
        // Глобальные обработчики Enter в формах
        this.setupFormEnterHandlers();
    }
    
    setupModalListeners() {
        // Закрытие модальных окон
        const closeButtons = {
            login: ['closeLoginModal', 'cancelLoginBtn'],
            register: ['closeRegisterModal', 'cancelRegisterBtn']
        };
        
        // Назначаем обработчики закрытия
        Object.keys(closeButtons).forEach(modalType => {
            closeButtons[modalType].forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.addEventListener('click', () => this.closeModal(modalType));
                }
            });
        });
        
        // Переключение между модальными окнами
        const switchLinks = {
            toRegister: 'showRegisterModalLink',
            toLogin: 'showLoginModalLink'
        };
        
        const toRegisterLink = document.getElementById(switchLinks.toRegister);
        if (toRegisterLink) {
            toRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('login', 'register');
            });
        }
        
        const toLoginLink = document.getElementById(switchLinks.toLogin);
        if (toLoginLink) {
            toLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('register', 'login');
            });
        }
        
        // Кнопки подтверждения
        const confirmLoginBtn = document.getElementById('confirmLoginBtn');
        if (confirmLoginBtn) {
            confirmLoginBtn.addEventListener('click', () => this.doLogin());
        }
        
        const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
        if (confirmRegisterBtn) {
            confirmRegisterBtn.addEventListener('click', () => this.doRegister());
        }
    }
    
    setupFormEnterHandlers() {
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        const regConfirmPassword = document.getElementById('regConfirmPassword');
        
        if (loginEmail) {
            loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('confirmLoginBtn')?.click();
                }
            });
        }
        
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('confirmLoginBtn')?.click();
                }
            });
        }
        
        if (regConfirmPassword) {
            regConfirmPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('confirmRegisterBtn')?.click();
                }
            });
        }
    }
    
    handleSignInClick(e, link) {
        // ВАЖНО: проверяем, авторизован ли пользователь
        if (this.token && this.user) {
            // Если пользователь авторизован и находится на странице профиля
            if (window.location.pathname.includes('profile.html')) {
                // На странице профиля - ничего не делаем, разрешаем стандартное поведение
                // (или можно добавить кнопку выхода отдельно на странице профиля)
                return true;
            } else {
                // На других страницах - разрешаем переход на профиль
                // Не отменяем событие, позволяем переходу по ссылке
                link.onclick = null; // Убираем обработчик
                return true; // Разрешаем стандартное поведение браузера
            }
        } else {
            // Если пользователь не авторизован - показываем модальное окно входа
            e.preventDefault();
            this.openModal('login');
        }
    }
    
    async checkAuthState() {
        console.log('Checking auth state...');
        
        const userData = localStorage.getItem('user_data');
        
        if (!this.token || !userData) {
            console.log('No token or user data found');
            this.updateNavForGuest();
            return;
        }
        
        try {
            this.user = JSON.parse(userData);
            console.log('User from localStorage:', this.user);
            
            // Обновляем интерфейс для авторизованного пользователя
            this.updateNavForUser(this.user);
            
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.updateNavForGuest();
        }
    }
    
    async validateToken() {
        if (!this.token || !this.user) return;
        
        try {
            const response = await fetch('/api/user', {
                headers: { 
                    'Authorization': `Bearer ${this.token}` 
                }
            });
            
            if (!response.ok) {
                // Токен невалидный
                this.updateNavForGuest();
            }
        } catch (error) {
            console.warn('Ошибка проверки токена:', error);
            // Оставляем пользователя авторизованным при ошибке сети
        }
    }
    
    openModal(modalType) {
        const modal = this.modals[modalType];
        if (!modal) {
            console.warn(`Modal ${modalType} not found`);
            return;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modalType) {
        const modal = this.modals[modalType];
        if (!modal) return;
        
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Очищаем ошибки
        this.clearFormErrors(modalType);
    }
    
    switchModal(fromModal, toModal) {
        this.closeModal(fromModal);
        this.openModal(toModal);
    }
    
    clearFormErrors(modalType) {
        const errorElements = modalType === 'login' 
            ? document.querySelectorAll('#loginModal .error-message')
            : document.querySelectorAll('#registerModal .error-message');
        
        errorElements.forEach(el => el.textContent = '');
    }
    
    // Валидация форм
    validateLoginForm() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        let isValid = true;
    
        const emailError = document.getElementById('loginEmailError');
        const passwordError = document.getElementById('loginPasswordError');
        
        if (emailError) emailError.textContent = '';
        if (passwordError) passwordError.textContent = '';
        
        if (!email) {
            if (emailError) emailError.textContent = 'Введите email';
            isValid = false;
        } else if (!this.validateEmail(email)) {
            if (emailError) emailError.textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            if (passwordError) passwordError.textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            if (passwordError) passwordError.textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }
        
        return isValid;
    }
    
    validateRegisterForm() {
        const name = document.getElementById('regName')?.value;
        const phone = document.getElementById('regPhone')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        let isValid = true;
        
        const errors = {
            name: document.getElementById('regNameError'),
            phone: document.getElementById('regPhoneError'),
            email: document.getElementById('regEmailError'),
            password: document.getElementById('regPasswordError'),
            confirmPassword: document.getElementById('regConfirmPasswordError')
        };
        
        // Очищаем ошибки
        Object.values(errors).forEach(el => {
            if (el) el.textContent = '';
        });
        
        if (!name) {
            if (errors.name) errors.name.textContent = 'Введите имя';
            isValid = false;
        }
        
        if (!email) {
            if (errors.email) errors.email.textContent = 'Введите email';
            isValid = false;
        } else if (!this.validateEmail(email)) {
            if (errors.email) errors.email.textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            if (errors.password) errors.password.textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            if (errors.password) errors.password.textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }
        
        if (!confirmPassword) {
            if (errors.confirmPassword) errors.confirmPassword.textContent = 'Подтвердите пароль';
            isValid = false;
        } else if (password !== confirmPassword) {
            if (errors.confirmPassword) errors.confirmPassword.textContent = 'Пароли не совпадают';
            isValid = false;
        }
        
        if (!phone) {
            if (errors.phone) errors.phone.textContent = 'Введите номер телефона';
            isValid = false;
        } else if (phone.length < 11 || phone.length > 12) {
            if (errors.phone) errors.phone.textContent = 'Длина номера должна быть от 11 до 12 цифр';
            isValid = false;
        }
        
        return isValid;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    async doLogin() {
        if (!this.validateLoginForm()) return;
        
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const errorElement = document.getElementById('loginPasswordError');
        
        try {
            const result = await this.loginUser(email, password);
            
            if (result.success) {
                this.closeModal('login');
                this.showSuccessMessage('Вы успешно вошли в систему!');
                
                // Сохраняем данные пользователя
                this.token = result.token;
                this.user = result.user;
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));
                
                // Обновляем интерфейс
                this.updateNavForUser(result.user);
                
                // Перенаправляем на профиль
                setTimeout(() => {
                    if (window.location.pathname.includes('profile.html')) {
                        window.location.reload();
                    } else {
                        window.location.href = 'profile.html';
                    }
                }, 1000);
            } else {
                if (errorElement) {
                    errorElement.textContent = result.error;
                }
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (errorElement) {
                errorElement.textContent = 'Ошибка входа. Попробуйте снова.';
            }
        }
    }
    
    async doRegister() {
        if (!this.validateRegisterForm()) return;
        
        const name = document.getElementById('regName')?.value;
        const phone = document.getElementById('regPhone')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const errorElement = document.getElementById('regEmailError');
        
        try {
            const result = await this.registerUser(name, phone, email, password);
            
            if (result.success) {
                this.closeModal('register');
                this.showSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
                
                // Автоматически входим после регистрации
                const loginResult = await this.loginUser(email, password);
                
                if (loginResult.success) {
                    this.token = loginResult.token;
                    this.user = loginResult.user;
                    localStorage.setItem('auth_token', loginResult.token);
                    localStorage.setItem('token', loginResult.token);
                    localStorage.setItem('user_data', JSON.stringify(loginResult.user));
                    
                    this.updateNavForUser(loginResult.user);
                    
                    // Перенаправляем на профиль
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                }
            } else {
                if (errorElement) {
                    errorElement.textContent = result.error;
                }
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            if (errorElement) {
                errorElement.textContent = 'Ошибка регистрации. Попробуйте снова.';
            }
        }
    }
    
    // API функции
    async loginUser(email, password) {
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
    
    async registerUser(name, phone, email, password) {
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
    
    updateNavForGuest() {
        console.log('Updating nav for guest');
        
        // Очищаем данные
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Обновляем ссылки входа
        this.signinLinks.forEach(link => {
            if (link) {
                link.textContent = 'Войти';
                link.href = '#';
                // Убираем старые обработчики
                link.removeEventListener('click', this.handleSignInClick);
                // Добавляем новый обработчик
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openModal('login');
                });
            }
        });
        
        // Скрываем все админские вкладки
        this.hideAdminTabs();
        
        // Удаляем ссылку "Пользователи" из навигации
        this.removeAdminNavigation();
    }
    
    updateNavForUser(user) {
        console.log('Updating nav for user:', user);
        
        // Обновляем ссылки входа
        this.signinLinks.forEach(link => {
            if (link) {
                const userName = user.name || user.username || 'Профиль';
                link.textContent = userName;
                link.href = 'profile.html';
                
                // Убираем старые обработчики
                link.removeEventListener('click', this.handleSignInClick);
                
                // Добавляем обработчик, который не мешает переходу на профиль
                link.addEventListener('click', (e) => this.handleSignInClick(e, link));
                
                // Также добавляем отдельную кнопку для выхода (опционально)
                this.addLogoutButtonIfNeeded();
            }
        });
        
        // Проверяем, является ли пользователь администратором
        const isAdmin = this.isUserAdmin(user);
        console.log('Is user admin?', isAdmin);
        
        // Показываем или скрываем админские вкладки и навигацию
        if (isAdmin) {
            this.showAdminTabs();
            this.addAdminNavigation();
        } else {
            this.hideAdminTabs();
            this.removeAdminNavigation();
        }
    }
    
    // Добавляем отдельную кнопку выхода на странице профиля
    addLogoutButtonIfNeeded() {
        if (!window.location.pathname.includes('profile.html')) return;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) {
            // Создаем кнопку выхода на странице профиля
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer) {
                const logoutButton = document.createElement('button');
                logoutButton.id = 'logoutBtn';
                logoutButton.className = 'btn btn-danger';
                logoutButton.textContent = 'Выйти из системы';
                logoutButton.style.marginTop = '20px';
                logoutButton.addEventListener('click', () => this.logout());
                profileContainer.appendChild(logoutButton);
            }
        }
    }
    
    isUserAdmin(user) {
        if (!user) return false;
        
        console.log('Checking admin status for user:', user);
        
        // Проверяем разными способами
        const roleName = (user.role || user.Role_Name || '').toLowerCase();
        const roleId = user.role_id || user.Role_ID;
        
        console.log('Role name:', roleName);
        console.log('Role ID:', roleId);
        
        // Различные варианты названия роли администратора
        const isAdmin = roleName.includes('админ') || 
                       roleName.includes('admin') ||
                       roleName === 'администратор' ||
                       roleName === 'administrator' ||
                       roleId === 1;
        
        return isAdmin;
    }
    
    showAdminTabs() {
        console.log('Showing admin tabs');
        
        const adminTabIds = [
            'carsTabItem',     // Управление авто
            'usersTabItem',    // Пользователи
            'newsTabItem'      // Управление новостями
        ];
        
        adminTabIds.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.style.display = 'block';
                console.log(`Tab ${tabId} shown`);
            }
        });
    }
    
    hideAdminTabs() {
        console.log('Hiding admin tabs');
        
        const adminTabIds = [
            'carsTabItem',
            'usersTabItem', 
            'newsTabItem'
        ];
        
        adminTabIds.forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.style.display = 'none';
            }
        });
    }
    
    addAdminNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;
        
        // Проверяем, есть ли уже ссылка "Пользователи"
        const existingUsersLink = document.querySelector('.nav-menu a[href="users.html"]');
        if (existingUsersLink) return;
        
        // Добавляем ссылку "Пользователи"
        const usersItem = document.createElement('li');
        usersItem.innerHTML = '<a href="users.html">Пользователи</a>';
        
        // Находим элемент "Войти" и добавляем перед ним
        const signinItem = this.signinLinks[0]?.closest('li');
        if (signinItem && signinItem.parentNode) {
            signinItem.parentNode.insertBefore(usersItem, signinItem);
        } else {
            navMenu.appendChild(usersItem);
        }
    }
    
    removeAdminNavigation() {
        // Удаляем ссылку "Пользователи" из навигации
        const usersLink = document.querySelector('.nav-menu a[href="users.html"]');
        if (usersLink && usersLink.closest('li')) {
            usersLink.closest('li').remove();
        }
    }
    
    async logout() {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (token) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    }
                });
            } catch (error) {
                console.error('Ошибка при выходе:', error);
            }
        }
        
        // Очищаем данные
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        
        // Обновляем навигацию
        this.updateNavForGuest();
        
        // Показываем уведомление
        this.showSuccessMessage('Выход выполнен');
        
        // Перенаправляем на главную страницу
        setTimeout(() => {
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            } else {
                window.location.reload();
            }
        }, 1000);
    }
    
    showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = message;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    // Глобальные функции для работы с избранным
    static addToFavorites(carId) {
        if (!localStorage.getItem('auth_token')) {
            alert('Для добавления в избранное необходимо войти в систему');
            if (window.signInView) {
                window.signInView.openModal('login');
            }
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
        SignInView.saveFavoriteToServer(carId);
        
        alert('Автомобиль добавлен в избранное!');
        return true;
    }
    
    static async saveFavoriteToServer(carId) {
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
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing SignInView');
    window.signInView = new SignInView();
    
    // Регистрируем глобальные функции
    window.addToFavorites = SignInView.addToFavorites;
    window.logoutUser = () => window.signInView?.logout();
});

// Глобальные функции для отладки
window.debugAuth = function() {
    console.log('=== Auth Debug ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('Auth Token:', localStorage.getItem('auth_token'));
    console.log('User Data:', localStorage.getItem('user_data'));
    console.log('SignInView instance:', window.signInView);
    console.log('Signin links:', document.querySelectorAll('#signinLink, .nav-menu a[href="signin.html"]').length);
    
    // Проверяем все элементы навигации
    const navItems = ['carsTabItem', 'usersTabItem', 'newsTabItem'];
    navItems.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}:`, el ? 'found' : 'not found', 'display:', el?.style.display);
    });
};