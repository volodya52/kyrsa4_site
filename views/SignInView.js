
class SignInView {
    constructor() {
       
        
        // Initialize Controllers and Models
        this.authController = new AuthController();
        this.authController.setView(this);
        this.userModel = new UserModel();
        
        this.user = this.userModel.getCurrentUser();
        
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
        
        // Проверяем состояние авторизации через модель
        this.checkAuthState();
        
        // Проверяем валидность токена
        await this.validateToken();
    }
    
    setupEventListeners() {
        // Обработчики для ссылок входа
        this.signinLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleSignInClick(e, link));
        });
        
        // Обработчики для модальных окон
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
        // Проверяем авторизацию через модель
        if (this.user) {
            // Если пользователь авторизован и находится на странице профиля
            if (window.location.pathname.includes('profile.html')) {
                return true;
            } else {
                // На других страницах - разрешаем переход на профиль
                link.onclick = null;
                return true;
            }
        } else {
            // Если пользователь не авторизован - показываем модальное окно входа
            e.preventDefault();
            this.openModal('login');
        }
    }
    
    async checkAuthState() {
        console.log('Checking auth state...');
        
        this.user = this.userModel.getCurrentUser();
        
        if (!this.user) {
            console.log('No user found');
            this.updateNavForGuest();
            return;
        }
        
        console.log('User from model:', this.user);
        
        // Обновляем интерфейс для авторизованного пользователя
        this.updateNavForUser(this.user);
    }
    
    async validateToken() {
        if (!this.user) return;
        
        const validation = await this.userModel.validateToken();
        if (!validation.isValid) {
            this.updateNavForGuest();
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
            const result = await this.authController.login(email, password);
            
            if (result.success) {
                this.closeModal('login');
                this.showSuccessMessage('Вы успешно вошли в систему!');
                
                // Обновляем данные пользователя
                this.user = result.user;
                
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
            const userData = { name, phone, email, password };
            const result = await this.authController.register(userData);
            
            if (result.success) {
                this.closeModal('register');
                this.showSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
                
                // Автоматически входим после регистрации
                const loginResult = await this.authController.login(email, password);
                
                if (loginResult.success) {
                    this.user = loginResult.user;
                    
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
    
    updateNavForGuest() {
        console.log('Updating nav for guest');
        
        // Очищаем данные через модель
        this.userModel.clearUserData();
        this.user = null;
        
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
                
                // Добавляем обработчик
                link.addEventListener('click', (e) => this.handleSignInClick(e, link));
                
                // Добавляем отдельную кнопку для выхода
                this.addLogoutButtonIfNeeded();
            }
        });
        
        // Проверяем, является ли пользователь администратором через модель
        const isAdmin = this.userModel.isAdmin();
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
        const result = await this.authController.logout();
        
        if (result.success) {
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
        const userModel = new UserModel();
        if (!userModel.getCurrentUser()) {
            alert('Для добавления в избранное необходимо войти в систему');
            if (window.signInView) {
                window.signInView.openModal('login');
            }
            return false;
        }
        
        const user = userModel.getCurrentUser();
        
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
        
        // Пробуем сохранить на сервере через контроллер
        SignInView.saveFavoriteToServer(carId);
        
        alert('Автомобиль добавлен в избранное!');
        return true;
    }
    
    static async saveFavoriteToServer(carId) {
        const favoriteController = new FavoriteController();
        return await favoriteController.addFavorite(carId);
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