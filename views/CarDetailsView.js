// CarDetailsView.js - UPDATED FOR MVC
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, находимся ли мы на странице деталей автомобиля
    const carImage = document.getElementById('carImage');
    if (!carImage) {
        console.log('Не на странице деталей автомобиля, пропускаем инициализацию');
        return;
    }
    
    console.log('На странице деталей автомобиля, начинаем инициализацию...');
    
    // Элементы DOM для отображения автомобиля
    const carTitle = document.getElementById('carTitle');
    const carPrice = document.getElementById('carPrice');
    const carStatusBadge = document.getElementById('carStatusBadge');
    const carDescription = document.getElementById('carDescription');
    const carBrand = document.getElementById('carBrand');
    const carModel = document.getElementById('carModel');
    const carYear = document.getElementById('carYear');
    const carMileage = document.getElementById('carMileage');
    const carEngine = document.getElementById('carEngine');
    const carHorsepower = document.getElementById('carHorsepower');
    const carTransmission = document.getElementById('carTransmission');
    const carFuel = document.getElementById('carFuel');
    const carBody = document.getElementById('carBody');
    const carColor = document.getElementById('carColor');
    
    // Кнопки действий
    const buyCarBtn = document.getElementById('buyCar');
    const creditBtn = document.getElementById('creditBtn');
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    // Модальные окна
    const buyModal = document.getElementById('buyModal');
    const creditModal = document.getElementById('creditModal');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    // Initialize Controllers and Models
    const carController = new CarController();
    const userModel = new UserModel();
    const favoriteController = new FavoriteController();
    const authController = new AuthController();
    
    // Данные
    let currentCar = null;
    let isFavorite = false;
    
    // Инициализация
    initCarDetails();
    
    async function initCarDetails() {
        console.log('Инициализация страницы деталей автомобиля...');
        
        // Получаем ID автомобиля из URL
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('id');
        
        console.log('Car ID from URL:', carId);
        
        if (!carId) {
            showError('ID автомобиля не указан');
            return;
        }
        
        // Показываем индикатор загрузки
        showLoading();
        
        // Загружаем данные автомобиля через контроллер
        await loadCarDetails(carId);
        
        // Проверяем авторизацию через модель
        const user = userModel.getCurrentUser();
        if (user) {
            updateSignInLink(user);
            // Если пользователь авторизован, проверяем избранное
            await checkIfFavorite(carId);
        }
        
        // Настраиваем обработчики событий
        setupEventListeners();
        setupAuthModals();
    }
    
    // Настройка модальных окон авторизации
    function setupAuthModals() {
        // Ссылки между модальными окнами
        const showRegisterModalLink = document.getElementById('showRegisterModalLink');
        const showLoginModalLink = document.getElementById('showLoginModalLink');
        
        if (showRegisterModalLink) {
            showRegisterModalLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (loginModal) loginModal.style.display = 'none';
                if (registerModal) registerModal.style.display = 'flex';
            });
        }
        
        if (showLoginModalLink) {
            showLoginModalLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (registerModal) registerModal.style.display = 'none';
                if (loginModal) loginModal.style.display = 'flex';
            });
        }
        
        // Закрытие модальных окон
        const closeLoginModal = document.getElementById('closeLoginModal');
        const closeRegisterModal = document.getElementById('closeRegisterModal');
        const cancelLoginBtn = document.getElementById('cancelLoginBtn');
        const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
        
        if (closeLoginModal) {
            closeLoginModal.addEventListener('click', () => {
                if (loginModal) loginModal.style.display = 'none';
            });
        }
        
        if (closeRegisterModal) {
            closeRegisterModal.addEventListener('click', () => {
                if (registerModal) registerModal.style.display = 'none';
            });
        }
        
        if (cancelLoginBtn) {
            cancelLoginBtn.addEventListener('click', () => {
                if (loginModal) loginModal.style.display = 'none';
            });
        }
        
        if (cancelRegisterBtn) {
            cancelRegisterBtn.addEventListener('click', () => {
                if (registerModal) registerModal.style.display = 'none';
            });
        }
        
        // Закрытие по клику вне модального окна
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.style.display = 'none';
                }
            });
        }
        
        if (registerModal) {
            registerModal.addEventListener('click', (e) => {
                if (e.target === registerModal) {
                    registerModal.style.display = 'none';
                }
            });
        }
        
        // Обработка входа
        const confirmLoginBtn = document.getElementById('confirmLoginBtn');
        if (confirmLoginBtn) {
            confirmLoginBtn.addEventListener('click', handleLogin);
        }
        
        // Обработка регистрации
        const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
        if (confirmRegisterBtn) {
            confirmRegisterBtn.addEventListener('click', handleRegister);
        }
        
        // Кнопка "Войти" в шапке
        const signinLink = document.getElementById('signinLink');
        if (signinLink) {
            signinLink.addEventListener('click', (e) => {
                e.preventDefault();
                const user = userModel.getCurrentUser();
                if (user) {
                    // Если пользователь уже авторизован, показываем меню профиля
                    handleLoggedInUser(user);
                } else {
                    // Если не авторизован, показываем окно входа
                    showAuthModal();
                }
            });
        }
    }
    
    // Показать окно авторизации
    function showAuthModal() {
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
    }
    
    // Обработка входа
    async function handleLogin() {
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
        if (!email || !password) {
            showNotification('Введите email и пароль', 'error');
            return;
        }
        
        try {
            const result = await authController.login(email, password);
            
            if (result.success) {
                showNotification('Вход выполнен успешно!', 'success');
                
                // Закрываем модальное окно
                if (loginModal) loginModal.style.display = 'none';
                
                // Обновляем кнопку входа
                updateSignInLink(result.user);
                
                // Проверяем избранное
                if (currentCar) {
                    await checkIfFavorite(currentCar.id || currentCar.ID);
                }
                
                // Выполняем отложенное действие, если оно было
                executePendingAction();
            } else {
                showNotification('Ошибка входа: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            showNotification('Ошибка сети. Попробуйте позже.', 'error');
        }
    }
    
    // Обработка регистрации
    async function handleRegister() {
        const name = document.getElementById('regName')?.value;
        const phone = document.getElementById('regPhone')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regConfirmPassword')?.value;
        
        // Валидация
        if (!name || !email || !password || !confirmPassword) {
            showNotification('Заполните все обязательные поля', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            const userData = { name, email, password, phone };
            const result = await authController.register(userData);
            
            if (result.success) {
                // Автоматически входим после регистрации
                const loginResult = await authController.login(email, password);
                
                if (loginResult.success) {
                    showNotification('Регистрация успешна!', 'success');
                    
                    // Закрываем модальное окно
                    if (registerModal) registerModal.style.display = 'none';
                    
                    // Обновляем кнопку входа
                    updateSignInLink(loginResult.user);
                    
                    // Проверяем избранное
                    if (currentCar) {
                        await checkIfFavorite(currentCar.id || currentCar.ID);
                    }
                    
                    // Выполняем отложенное действие, если оно было
                    executePendingAction();
                }
            } else {
                showNotification('Ошибка регистрации: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            showNotification('Ошибка сети. Попробуйте позже.', 'error');
        }
    }
    
    // Хранение отложенного действия
    let pendingAction = null;
    
    // Установить отложенное действие
    function setPendingAction(action) {
        pendingAction = action;
    }
    
    // Выполнить отложенное действие
    function executePendingAction() {
        if (pendingAction) {
            pendingAction();
            pendingAction = null;
        }
    }
    
    // Обновить кнопку входа в шапке
    function updateSignInLink(user) {
        const signinLink = document.getElementById('signinLink');
        if (!signinLink) return;
        
        if (user) {
            signinLink.textContent = user.name;
            signinLink.href = '#';
            signinLink.title = 'Профиль';
        } else {
            signinLink.textContent = 'Войти';
            signinLink.href = '#';
            signinLink.title = 'Войти в систему';
        }
    }
    
    // Обработка для авторизованного пользователя
    function handleLoggedInUser(user) {
        if (confirm(`Вы вошли как ${user.name}. Хотите выйти?`)) {
            handleLogout();
        }
    }
    
    // Выход из системы
    async function handleLogout() {
        const result = await authController.logout();
        
        if (result.success) {
            showNotification('Вы вышли из системы', 'info');
            updateSignInLink(null);
            updateFavoriteButton();
        }
    }
    
    // Показать индикатор загрузки
    function showLoading() {
        if (carTitle) carTitle.textContent = 'Загрузка...';
        if (carPrice) carPrice.textContent = '-';
        if (carDescription) carDescription.textContent = 'Загрузка описания...';
    }
    
    // Загрузка данных автомобиля
    async function loadCarDetails(carId) {
        try {
            console.log('Загрузка деталей автомобиля ID:', carId);
            
            // Используем контроллер для загрузки данных
            currentCar = await carController.getCarDetails(carId);
            
            if (!currentCar) {
                throw new Error(`Не удалось найти автомобиль с ID ${carId}`);
            }
            
            displayCarDetails(currentCar);
        } catch (error) {
            console.error('Ошибка загрузки деталей автомобиля:', error);
            showError('Не удалось загрузить данные автомобиля: ' + error.message);
        }
    }
    
    // Отображение данных автомобиля
    function displayCarDetails(car) {
        console.log('Отображение данных автомобиля:', car);
        
        // Заголовок и цена
        const brand = car.brand || car.Brand || 'Не указана';
        const model = car.model || car.Model || 'Не указана';
        const price = car.price || car.Price || 0;
        const status = car.status || car.Status || 'В наличии';
        
        if (carTitle) carTitle.textContent = `${brand} ${model}`;
        if (carPrice) carPrice.textContent = formatPrice(price);
        
        // Статус (бейдж)
        if (carStatusBadge) {
            carStatusBadge.textContent = status;
            carStatusBadge.className = 'car-status-badge';
            carStatusBadge.classList.add(getStatusClass(status));
        }
        
        // Описание
        if (carDescription) {
            const description = car.description || car.Description || 'Описание отсутствует';
            carDescription.textContent = description;
            carDescription.style.whiteSpace = 'pre-wrap';
        }
        
        // Изображение
        const imageUrl = car.image_url || car.Image_url || 'https://via.placeholder.com/600x400?text=Автомобиль';
        if (carImage) {
            carImage.src = imageUrl;
            carImage.alt = `${brand} ${model}`;
            carImage.onerror = function() {
                this.src = 'https://via.placeholder.com/600x400?text=Ошибка+загрузки';
            };
        }
        
        // Характеристики
        if (carBrand) carBrand.textContent = brand || '-';
        if (carModel) carModel.textContent = model || '-';
        if (carYear) {
            const year = car.year || car.Year || 'Не указан';
            carYear.textContent = year;
        }
        
        if (carMileage) {
            const mileage = car.mileage || car.Mileage || 0;
            carMileage.textContent = mileage === 0 ? 'Новый' : `${mileage.toLocaleString('ru-RU')} км`;
        }
        
        if (carEngine) {
            const engineSize = car.engineSize || car.EngineSize;
            carEngine.textContent = engineSize ? `${engineSize} л` : 'Не указан';
        }
        
        if (carHorsepower) {
            const horsepower = car.horsepower || car.Horsepower;
            carHorsepower.textContent = horsepower ? `${horsepower} л.с.` : 'Не указано';
        }
        
        if (carTransmission) {
            const transmission = car.transmission || car.Transmission || 'Не указана';
            carTransmission.textContent = transmission;
        }
        
        if (carFuel) {
            const fuel = car.fuel || car.Fuel || 'Не указано';
            carFuel.textContent = fuel;
        }
        
        if (carBody) {
            const body = car.body || car.Body || 'Не указан';
            carBody.textContent = body;
        }
        
        if (carColor) {
            const color = car.color || car.Color || 'Не указан';
            carColor.textContent = color;
        }
    }
    
    // Получить CSS класс для статуса
    function getStatusClass(status) {
        const statusMap = {
            'В наличии': 'status-in-stock',
            'Новый': 'status-new',
            'Б/У': 'status-used',
            'Продано': 'status-sold',
            'Предзаказ': 'status-preorder'
        };
        return statusMap[status] || 'status-default';
    }
    
    // Проверка, в избранном ли автомобиль
    async function checkIfFavorite(carId) {
        if (!carId) return;
        
        try {
            isFavorite = await favoriteController.checkFavorite(carId);
            updateFavoriteButton();
        } catch (error) {
            console.error('Ошибка проверки избранного:', error);
        }
    }
    
    // Форматирование цены
    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Кнопка "Купить автомобиль"
        if (buyCarBtn) {
            buyCarBtn.addEventListener('click', () => {
                if (!userModel.getCurrentUser()) {
                    // Сохраняем действие и показываем окно авторизации
                    setPendingAction(() => {
                        openBuyModal();
                    });
                    showAuthModal();
                    return;
                }
                openBuyModal();
            });
        }
        
        // Кнопка "Рассчитать кредит"
        if (creditBtn) {
            creditBtn.addEventListener('click', () => {
                openCreditModal();
            });
        }
        
        // Кнопка "В избранное"
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                if (!userModel.getCurrentUser()) {
                    // Сохраняем действие и показываем окно авторизации
                    setPendingAction(() => {
                        toggleFavorite();
                    });
                    showAuthModal();
                    return;
                }
                toggleFavorite();
            });
        }
        
        // Настройка модальных окон
        setupBuyModal();
        setupCreditModal();
    }
    
    // Переключение избранного
    async function toggleFavorite() {
        if (!currentCar) {
            showNotification('Данные автомобиля не загружены', 'error');
            return;
        }
        
        const carId = currentCar.id || currentCar.ID;
        const carName = `${currentCar.brand || currentCar.Brand} ${currentCar.model || currentCar.Model}`;
        
        try {
            const result = await carController.toggleFavorite(carId, carName);
            
            if (result.requiresLogin) {
                showLoginPrompt();
                return;
            }
            
            if (result.success) {
                isFavorite = result.isFavorite;
                updateFavoriteButton();
                showNotification(result.message, 'success');
            } else {
                showNotification('Ошибка: ' + (result.error || ''), 'error');
            }
        } catch (error) {
            console.error('Ошибка переключения избранного:', error);
            showNotification('Ошибка сети. Попробуйте позже.', 'error');
        }
    }
    
    // Обновление кнопки избранного
    function updateFavoriteButton() {
        if (!favoriteBtn) return;
        
        const carName = `${currentCar.brand || currentCar.Brand} ${currentCar.model || currentCar.Model}`;
        
        favoriteBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFavorite ? '#ff4757' : 'none'}" 
                 stroke="${isFavorite ? '#ff4757' : 'currentColor'}" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${isFavorite ? 'В избранном' : 'В избранное'}
        `;
        
        favoriteBtn.title = isFavorite ? `Удалить "${carName}" из избранного` : `Добавить "${carName}" в избранное`;
        
        if (isFavorite) {
            favoriteBtn.classList.add('active');
            favoriteBtn.classList.remove('btn-outline');
        } else {
            favoriteBtn.classList.remove('active');
            favoriteBtn.classList.add('btn-outline');
        }
    }
    
    // Показать предложение войти (резервный вариант)
    function showLoginPrompt() {
        if (confirm('Для выполнения действия нужно войти в систему. Перейти к авторизации?')) {
            showAuthModal();
        }
    }
    
    // Открытие модального окна покупки
    function openBuyModal() {
        if (!buyModal || !currentCar) return;
        
        // Автозаполнение формы данными пользователя, если он авторизован
        const user = userModel.getCurrentUser();
        if (user) {
            const buyName = document.getElementById('buyName');
            const buyPhone = document.getElementById('buyPhone');
            const buyEmail = document.getElementById('buyEmail');
            
            if (buyName && user.name) buyName.value = user.name;
            if (buyEmail && user.email) buyEmail.value = user.email;
            if (buyPhone && user.phone) buyPhone.value = user.phone || '';
        }
        
        buyModal.style.display = 'flex';
    }
    
    // Настройка модального окна покупки
    function setupBuyModal() {
        const closeBuyModal = document.getElementById('closeBuyModal');
        const cancelBuyBtn = document.getElementById('cancelBuyBtn');
        const confirmBuyBtn = document.getElementById('confirmBuyBtn');
        
        if (!closeBuyModal || !cancelBuyBtn || !confirmBuyBtn) {
            console.warn('Элементы модального окна покупки не найдены');
            return;
        }
        
        closeBuyModal.addEventListener('click', () => {
            buyModal.style.display = 'none';
        });
        
        cancelBuyBtn.addEventListener('click', () => {
            buyModal.style.display = 'none';
        });
        
        confirmBuyBtn.addEventListener('click', async () => {
            await submitBuyRequest();
        });
        
        // Закрытие по клику вне модального окна
        buyModal.addEventListener('click', (e) => {
            if (e.target === buyModal) {
                buyModal.style.display = 'none';
            }
        });
    }
    
    // Отправка заявки на покупку
    async function submitBuyRequest() {
        const name = document.getElementById('buyName')?.value;
        const phone = document.getElementById('buyPhone')?.value;
        const email = document.getElementById('buyEmail')?.value;
        const paymentMethod = document.getElementById('buyPaymentMethod')?.value;
        const message = document.getElementById('buyMessage')?.value;
        
        // Валидация
        if (!name || !phone || !email) {
            showNotification('Заполните обязательные поля', 'error');
            return;
        }
        
        if (!currentCar) {
            showNotification('Данные автомобиля не загружены', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    phone,
                    email,
                    paymentMethod,
                    message,
                    carId: currentCar.id || currentCar.ID,
                    carBrand: currentCar.brand || currentCar.Brand,
                    carModel: currentCar.model || currentCar.Model
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Заявка на покупку отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                if (buyModal) buyModal.style.display = 'none';
                // Очищаем форму
                const buyForm = document.getElementById('buyForm');
                if (buyForm) buyForm.reset();
            } else {
                showNotification('Ошибка отправки заявки: ' + (data.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Ошибка отправки заявки на покупку:', error);
            showNotification('Ошибка отправки заявки. Попробуйте позже.', 'error');
        }
    }
    
    // Открытие модального окна кредитного калькулятора
    function openCreditModal() {
        if (!creditModal || !currentCar) return;
        
        // Заполняем информацию об автомобиле в калькуляторе
        const calcCarImage = document.getElementById('calcCarImage');
        const calcCarTitle = document.getElementById('calcCarTitle');
        const calcCarPrice = document.getElementById('calcCarPrice');
        
        if (calcCarImage) {
            const imageUrl = currentCar.image_url || currentCar.Image_url || 'https://via.placeholder.com/300x200?text=Автомобиль';
            calcCarImage.src = imageUrl;
            calcCarImage.alt = `${currentCar.brand || currentCar.Brand} ${currentCar.model || currentCar.Model}`;
        }
        
        if (calcCarTitle) {
            calcCarTitle.textContent = `${currentCar.brand || currentCar.Brand} ${currentCar.model || currentCar.Model}`;
        }
        
        if (calcCarPrice) {
            const price = currentCar.price || currentCar.Price || 0;
            calcCarPrice.textContent = formatPrice(price);
        }
        
        // Инициализируем калькулятор
        initCreditCalculator();
        
        // Показываем модальное окно
        creditModal.style.display = 'flex';
    }
    
    // Настройка модального окна кредитного калькулятора
    function setupCreditModal() {
        const closeCreditModal = document.getElementById('closeCreditModal');
        const cancelCreditBtn = document.getElementById('cancelCreditBtn');
        const applyCreditBtn = document.getElementById('applyCreditBtn');
        
        if (!closeCreditModal || !cancelCreditBtn || !applyCreditBtn) {
            console.warn('Элементы модального окна кредита не найдены');
            return;
        }
        
        closeCreditModal.addEventListener('click', () => {
            creditModal.style.display = 'none';
        });
        
        cancelCreditBtn.addEventListener('click', () => {
            creditModal.style.display = 'none';
        });
        
        applyCreditBtn.addEventListener('click', () => {
            if (!userModel.getCurrentUser()) {
                // Сохраняем действие и показываем окно авторизации
                setPendingAction(() => {
                    showNotification('Заявка на кредит будет отправлена при оформлении покупки', 'info');
                    creditModal.style.display = 'none';
                });
                showAuthModal();
                return;
            }
            showNotification('Заявка на кредит будет отправлена при оформлении покупки', 'info');
            creditModal.style.display = 'none';
        });
        
        // Закрытие по клику вне модального окна
        creditModal.addEventListener('click', (e) => {
            if (e.target === creditModal) {
                creditModal.style.display = 'none';
            }
        });
    }
    
    // Инициализация кредитного калькулятора
    function initCreditCalculator() {
        if (!currentCar) return;
        
        const carPriceValue = currentCar.price || currentCar.Price || 0;
        if (carPriceValue <= 0) return;
        
        // Элементы калькулятора
        const calcInitialPayment = document.getElementById('calcInitialPayment');
        const calcInitialPaymentRange = document.getElementById('calcInitialPaymentRange');
        const calcInitialPaymentPercent = document.getElementById('calcInitialPaymentPercent');
        const calcCreditTerm = document.getElementById('calcCreditTerm');
        const calcCreditTermRange = document.getElementById('calcCreditTermRange');
        const calcInterestRate = document.getElementById('calcInterestRate');
        const calcCalculateCreditBtn = document.getElementById('calcCalculateCredit');
        
        // Результаты
        const calcLoanAmount = document.getElementById('calcLoanAmount');
        const calcMonthlyPayment = document.getElementById('calcMonthlyPayment');
        const calcOverpayment = document.getElementById('calcOverpayment');
        const calcTotalAmount = document.getElementById('calcTotalAmount');
        
        if (!calcInitialPayment || !calcInitialPaymentRange) return;
        
        // Настройка процентных ставок в выпадающем списке
        if (calcInterestRate) {
            // Удаляем старые опции
            calcInterestRate.innerHTML = '';
            
            
            const rates = [
                { value: 16.9, label: 'ВТБ (наличные) - 16.9%' },
                { value: 14.9, label: 'ОТП-банк - 14.9%' },
                { value: 18.99, label: 'Альфа-банк - 18.99%' },
                { value: 25.5, label: 'Сбербанк - 25.5%' },
                { value: 22.9, label: 'Т-банк - 22.9%' }
            ];
            
            rates.forEach(rate => {
                const option = document.createElement('option');
                option.value = rate.value;
                option.textContent = rate.label;
                calcInterestRate.appendChild(option);
            });
            
            // Устанавливаем ВТБ наличные как значение по умолчанию
            calcInterestRate.value = 16.9;
        }
        
        // Устанавливаем начальные значения
        const initialAmount = Math.round(carPriceValue * 0.2);
        calcInitialPayment.value = initialAmount;
        calcInitialPaymentRange.value = 20;
        updateInitialPaymentPercent();
        
        // Синхронизация ползунка и поля ввода
        calcInitialPayment.addEventListener('input', function() {
            const value = parseInt(this.value) || 0;
            const percent = Math.min(100, Math.round((value / carPriceValue) * 100));
            calcInitialPaymentRange.value = percent;
            updateInitialPaymentPercent();
            calculateCredit();
        });
        
        calcInitialPaymentRange.addEventListener('input', function() {
            const percent = parseInt(this.value);
            const amount = Math.round(carPriceValue * (percent / 100));
            calcInitialPayment.value = amount;
            updateInitialPaymentPercent();
            calculateCredit();
        });
        
        // Синхронизация ползунка и поля ввода срока кредита
        if (calcCreditTerm && calcCreditTermRange) {
            calcCreditTerm.addEventListener('input', function() {
                const value = parseInt(this.value) || 36;
                const clampedValue = Math.min(84, Math.max(12, value));
                this.value = clampedValue;
                calcCreditTermRange.value = clampedValue;
                calculateCredit();
            });
            
            calcCreditTermRange.addEventListener('input', function() {
                const value = parseInt(this.value);
                calcCreditTerm.value = value;
                calculateCredit();
            });
        }
        
        // Изменение процентной ставки
        if (calcInterestRate) {
            calcInterestRate.addEventListener('change', function() {
                calculateCredit();
            });
        }
        
        // Кнопка расчета
        if (calcCalculateCreditBtn) {
            calcCalculateCreditBtn.addEventListener('click', function() {
                calculateCredit();
                showNotification('Расчет кредита обновлен', 'success');
            });
        }
        
        // Первоначальный расчет
        calculateCredit();
        
        function updateInitialPaymentPercent() {
            if (!calcInitialPaymentPercent || !calcInitialPaymentRange) return;
            const percent = calcInitialPaymentRange.value;
            calcInitialPaymentPercent.textContent = `${percent}% от стоимости`;
        }
        
        function calculateAnnuityPayment(P, N, r) {
            if (r === 0) {
                return P / N;
            }
            
            const coefficient = (r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
            return Math.round(P * coefficient);
        }
        
        function calculateCredit() {
            const initialAmount = parseInt(calcInitialPayment.value) || 0;
            const termMonths = parseInt(calcCreditTerm.value) || 36;
            const annualRate = parseFloat(calcInterestRate.value) || 16.9;
            
            if (initialAmount >= carPriceValue) {
                showNotification('Первоначальный взнос не может быть больше стоимости автомобиля', 'error');
                return;
            }

            if(initialAmount<0){
                showNotification('Первоначальный взнос не может быть меньше 0', 'error');
                return;
            }
            
            const loan = carPriceValue - initialAmount;
            const monthlyRate = annualRate / 100 / 12;
            const monthlyPaymentAmount = calculateAnnuityPayment(loan, termMonths, monthlyRate);
            const totalPayment = monthlyPaymentAmount * termMonths;
            const overpaymentAmount = totalPayment - loan;
            
            if (calcLoanAmount) calcLoanAmount.textContent = formatPrice(loan);
            if (calcMonthlyPayment) calcMonthlyPayment.textContent = formatPrice(monthlyPaymentAmount);
            if (calcOverpayment) calcOverpayment.textContent = formatPrice(overpaymentAmount);
            if (calcTotalAmount) calcTotalAmount.textContent = formatPrice(totalPayment + initialAmount);
        }
    }
    
    // Показать уведомление
    function showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'info' ? '#2196F3' : '#ffc107'};
            color: white;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
            max-width: 500px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                    line-height: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Показать ошибку
    function showError(message) {
        const container = document.querySelector('.car-details-container') || document.querySelector('main');
        if (container) {
            container.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 60px 20px;">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">Ошибка</h2>
                    <p style="color: #666; margin-bottom: 30px; font-size: 18px;">${message}</p>
                    <button class="btn btn-primary" onclick="window.location.href='cars.html'">
                        Вернуться к каталогу
                    </button>
                </div>
            `;
        } else {
            alert(message + '\n\nПерейдите на страницу каталога автомобилей.');
            window.location.href = 'cars.html';
        }
    }
});