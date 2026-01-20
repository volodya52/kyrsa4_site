// CarView.js - ВЕРСИЯ С ИСПРАВЛЕННЫМ ИЗБРАННЫМ
class CarView {
    constructor() {
        // Элементы DOM
        this.carsGrid = document.getElementById('carsGrid');
        this.carsCount = document.getElementById('carsCount');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.activeFilters = document.getElementById('activeFilters');
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        
        // Элементы фильтров
        this.brandFilter = document.getElementById('brandFilter');
        this.typeFilter = document.getElementById('typeFilter');
        this.yearFilter = document.getElementById('yearFilter');
        this.priceFrom = document.getElementById('priceFrom');
        this.priceTo = document.getElementById('priceTo');
        this.statusFilter = document.getElementById('statusFilter');
        this.applyFilters = document.getElementById('applyFilters');
        this.resetFilters = document.getElementById('resetFilters');
        
        // Данные
        this.allCars = [];
        this.filteredCars = [];
        this.currentFilters = {};
        
        // Добавим данные о пользователе и избранном
        this.currentUser = null;
        this.favoriteCars = new Set();
        
        // Добавим отладочный лог
        console.log('CarView инициализирован');
        
        // Инициализация
        this.init();
    }
    
    async init() {
        console.log('Инициализация CarView...');
        
        // Загружаем информацию о пользователе
        this.loadUserData();
        
        // Загружаем автомобили
        await this.loadCars();
        
        // Если пользователь авторизован, загружаем его избранное
        if (this.currentUser) {
            await this.loadUserFavorites();
        }
        
        // Инициализируем фильтры
        this.initFilters();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
    }
    
    // Загрузка данных пользователя
    loadUserData() {
        try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                console.log('Пользователь загружен:', this.currentUser);
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        }
    }
    
    // Загрузка избранного пользователя
    async loadUserFavorites() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token || !this.currentUser) return;
            
            const response = await fetch('/api/user/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                console.warn('Не удалось загрузить избранное');
                return;
            }
            
            const data = await response.json();
            if (data.success && data.favorites) {
                // Сохраняем ID избранных автомобилей
                data.favorites.forEach(car => {
                    this.favoriteCars.add(car.id);
                });
                console.log('Избранное загружено:', this.favoriteCars);
            }
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
        }
    }
    
    // Загрузка автомобилей из API
    async loadCars() {
        try {
            console.log('Начинаем загрузку автомобилей...');
            this.showLoading(true);
            
            const apiUrl = '/api/cars';
            console.log('Запрос к:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            console.log('Ответ получен. Статус:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Данные ответа:', data);
            
            if (data.success) {
                this.allCars = data.cars || [];
                this.filteredCars = [...this.allCars];
                
                console.log(`Загружено ${this.allCars.length} автомобилей:`, this.allCars);
                
                // Отображаем автомобили
                this.displayCars(this.filteredCars);
                
                // Обновляем счетчик
                this.updateCarsCount(this.filteredCars.length);
                
                // Обновляем опции фильтров
                this.updateFilterOptions();
            } else {
                console.error('API вернул ошибку:', data.error);
                
                // Пробуем альтернативный API endpoint
                await this.loadAllCars();
            }
        } catch (error) {
            console.error('Ошибка загрузки автомобилей:', error);
            
            // Пробуем альтернативный способ загрузки
            await this.loadAllCars();
        } finally {
            this.showLoading(false);
        }
    }
    
    // Альтернативный метод загрузки всех автомобилей
    async loadAllCars() {
        try {
            console.log('Пробуем загрузить все автомобили через альтернативный метод...');
            
            // Используем endpoint который точно работает
            const response = await fetch('/api/admin/cars');
            const data = await response.json();
            
            if (data.success) {
                this.allCars = data.cars || [];
                this.filteredCars = [...this.allCars];
                
                console.log(`Загружено ${this.allCars.length} автомобилей через альтернативный метод:`, this.allCars);
                
                this.displayCars(this.filteredCars);
                this.updateCarsCount(this.filteredCars.length);
                this.updateFilterOptions();
            } else {
                this.showError('Не удалось загрузить автомобили: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка альтернативной загрузки:', error);
            this.showError('Не удалось загрузить автомобили. Проверьте консоль для деталей.');
        }
    }
    
    // Отображение автомобилей
    displayCars(cars) {
        console.log('displayCars вызван с', cars ? cars.length : 'undefined', 'автомобилями');
        
        if (!this.carsGrid) {
            console.error('Элемент carsGrid не найден!');
            return;
        }
        
        // Проверяем, что cars - это массив
        if (!Array.isArray(cars)) {
            console.error('cars не является массивом:', cars);
            this.showError('Ошибка данных: ожидался массив автомобилей');
            return;
        }
        
        if (cars.length === 0) {
            console.log('Нет автомобилей для отображения');
            this.carsGrid.innerHTML = `
                <div class="no-results">
                    <h3>Автомобили не найдены</h3>
                    <button class="btn" onclick="window.carView.loadCars()">Попробовать снова</button>
                </div>
            `;
            return;
        }
        
        // Создаем HTML
        let html = '';
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            html += this.createCarCard(car);
        }
        
        // Вставляем в DOM
        this.carsGrid.innerHTML = html;
    }
    
    // Создание карточки автомобиля С ИЗБРАННЫМ
    createCarCard(car) {
        console.log('Создание карточки для:', car);
        
        // Проверяем наличие обязательных полей
        if (!car || typeof car !== 'object') {
            console.error('Недостаточно данных для автомобиля:', car);
            return '<div class="car-card error">Ошибка данных автомобиля</div>';
        }
        
        // Извлекаем данные с проверкой
        const id = car.id || car.ID || '';
        const brand = car.brand || car.Brand || 'Марка не указана';
        const model = car.model || car.Model || 'Модель не указана';
        const year = car.year || car.Year || '';
        const price = car.price || car.Price || 0;
        const mileage = car.mileage || car.Mileage || 0;
        const engineSize = car.engineSize || car.EngineSize || '';
        const horsepower = car.horsepower || car.Horsepower || '';
        const transmission = car.transmission || car.Transmission || '';
        const body = car.body || car.Body || '';
        const status = car.status || car.Status || '';
        const imageUrl = car.image_url || car.Image_url || 'https://via.placeholder.com/300x200?text=Нет+фото';
        
        // Проверяем, в избранном ли автомобиль
        const isFavorite = this.favoriteCars.has(parseInt(id));
        
        // Форматируем цену
        const formattedPrice = price ? new Intl.NumberFormat('ru-RU').format(price) : 'Цена не указана';
        
        // Форматируем пробег
        const formattedMileage = mileage === 0 ? 'Новый' : `${mileage.toLocaleString('ru-RU')} км`;
        
        // Создаем HTML карточки
        return `
            <div class="car-card" data-id="${id}">
                <div class="car-image">
                    <img src="${imageUrl}" 
                         alt="${brand} ${model}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки';">
                    ${status ? `<span class="car-badge">${status}</span>` : ''}
                    
                    <!-- Кнопка избранного -->
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="window.carView.toggleFavorite(${id}, '${brand} ${model}', this)"
                            title="${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFavorite ? '#ff4757' : 'none'}" 
                             stroke="${isFavorite ? '#ff4757' : '#666'}" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                </div>
                <div class="car-info">
                    <h3 class="car-title">${brand} ${model}</h3>
                    <p class="car-description">
                        ${year ? year + ',' : ''} 
                        ${body ? body + ',' : ''} 
                        ${transmission || ''}
                    </p>
                    <div class="car-specs">
                        ${engineSize ? `<span class="spec-item">${engineSize}L</span>` : ''}
                        ${horsepower ? `<span class="spec-item">${horsepower} л.с.</span>` : ''}
                        <span class="spec-item">${formattedMileage}</span>
                    </div>
                    <div class="car-footer">
                        <div class="car-price">${formattedPrice} ₽</div>
                        <button class="btn btn-small view-details" data-id="${id}" 
                                onclick="window.carView.viewCarDetails(${id})">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Переключение избранного
    async toggleFavorite(carId, carName, button) {
        // Проверяем авторизацию
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.showLoginPrompt();
            return;
        }
        
        const isCurrentlyFavorite = this.favoriteCars.has(carId);
        
        try {
            if (isCurrentlyFavorite) {
                // Удаляем из избранного
                const response = await fetch(`/api/user/favorites/${carId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.favoriteCars.delete(carId);
                    this.updateFavoriteButton(button, false);
                    this.showNotification(`"${carName}" удален из избранного`, 'success');
                } else {
                    this.showNotification('Ошибка удаления из избранного', 'error');
                }
            } else {
                // Добавляем в избранное
                const response = await fetch('/api/user/favorites', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ carId })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.favoriteCars.add(carId);
                    this.updateFavoriteButton(button, true);
                    this.showNotification(`"${carName}" добавлен в избранное`, 'success');
                } else {
                    this.showNotification('Ошибка добавления в избранное', 'error');
                }
            }
        } catch (error) {
            console.error('Ошибка переключения избранного:', error);
            this.showNotification('Ошибка сети. Попробуйте позже.', 'error');
        }
    }
    
    // Обновление кнопки избранного
    updateFavoriteButton(button, isFavorite) {
        const svg = button.querySelector('svg');
        if (svg) {
            svg.style.fill = isFavorite ? '#ff4757' : 'none';
            svg.style.stroke = isFavorite ? '#ff4757' : '#666';
        }
        
        // Добавляем/убираем класс active
        if (isFavorite) {
            button.classList.add('active');
            button.title = 'Удалить из избранного';
        } else {
            button.classList.remove('active');
            button.title = 'Добавить в избранное';
        }
        
        // Анимация
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Показать предложение войти
    showLoginPrompt() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            return;
        }
        
        // Если модального окна нет, показываем алерт
        if (confirm('Чтобы добавить в избранное, нужно войти в систему. Перейти к авторизации?')) {
            window.location.href = 'index.html#login';
        }
    }
    
    // Показать уведомление
    showNotification(message, type = 'success') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
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
        
        // Кнопка закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Добавляем в DOM
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Добавляем CSS анимации если их нет
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
    
    // Обновить избранное при авторизации
    updateFavoritesOnLogin() {
        this.loadUserData();
        if (this.currentUser) {
            this.loadUserFavorites().then(() => {
                // Перерисовываем автомобили с обновленным статусом избранного
                this.displayCars(this.filteredCars);
            });
        }
    }
    
    // Обновление опций фильтров
    updateFilterOptions() {
        try {
            console.log('Обновление опций фильтров...');
            
            if (!this.brandFilter || !this.yearFilter) {
                console.error('Элементы фильтров не найдены');
                return;
            }
            
            // Очищаем текущие опции
            this.brandFilter.innerHTML = '<option value="">Все марки</option>';
            this.yearFilter.innerHTML = '<option value="">Любой год</option>';
            
            // Собираем уникальные марки и года
            const brands = new Set();
            const years = new Set();
            const statuses = new Set();
            
            this.allCars.forEach(car => {
                const brand = car.brand || car.Brand;
                const year = car.year || car.Year;
                const status = car.status || car.Status;
                
                if (brand) brands.add(brand);
                if (year) years.add(year);
                if (status) statuses.add(status);
            });
            
            console.log('Уникальные марки:', Array.from(brands));
            console.log('Уникальные года:', Array.from(years));
            console.log('Уникальные статусы:', Array.from(statuses));
            
            // Сортируем марки по алфавиту
            const sortedBrands = Array.from(brands).sort();
            
            // Добавляем марки в фильтр
            sortedBrands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                this.brandFilter.appendChild(option);
            });
            
            // Сортируем года по убыванию
            const sortedYears = Array.from(years).sort((a, b) => b - a);
            
            // Добавляем года в фильтр
            sortedYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                this.yearFilter.appendChild(option);
            });
            
            // Обновляем фильтр статусов если он есть
            if (this.statusFilter) {
                this.statusFilter.innerHTML = '<option value="">Все статусы</option>';
                Array.from(statuses).sort().forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    this.statusFilter.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('Ошибка при обновлении фильтров:', error);
        }
    }
    
    // Инициализация фильтров
    initFilters() {
        console.log('Инициализация фильтров...');
        // Настраиваем фильтры цен
        if (this.priceTo) {
            this.priceTo.placeholder = '10000000';
        }
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Поиск по нажатию Enter
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
        
        // Поиск по клику
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this.handleSearch());
        }
        
        // Применение фильтров
        if (this.applyFilters) {
            this.applyFilters.addEventListener('click', () => this.handleFilterApply());
        }
        
        // Сброс фильтров
        if (this.resetFilters) {
            this.resetFilters.addEventListener('click', () => this.handleFilterReset());
        }
        
        // Обработчик для карточек автомобилей
        if (this.carsGrid) {
            this.carsGrid.addEventListener('click', (e) => {
                const target = e.target;
                
                // Кнопка "Подробнее"
                if (target.classList.contains('view-details') || target.closest('.view-details')) {
                    const button = target.classList.contains('view-details') ? target : target.closest('.view-details');
                    const carId = button.getAttribute('data-id');
                    if (carId) {
                        this.viewCarDetails(carId);
                    }
                }
            });
        }
        
        // Удаление активных фильтров
        if (this.activeFilters) {
            this.activeFilters.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-filter')) {
                    const filterKey = e.target.getAttribute('data-filter');
                    this.removeFilter(filterKey);
                }
            });
        }
    }
    
    // Обработка поиска
    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        console.log('Поиск:', searchTerm);
        
        if (searchTerm) {
            this.searchCars({ model: searchTerm });
        } else {
            // Если поиск пустой, показываем все автомобили
            this.filteredCars = [...this.allCars];
            this.displayCars(this.filteredCars);
            this.updateCarsCount(this.filteredCars.length);
            this.currentFilters = {};
            this.updateActiveFilters({});
        }
    }
    
    // Применение фильтров
    handleFilterApply() {
        const filters = {};
        
        // Собираем значения фильтров
        if (this.brandFilter && this.brandFilter.value) {
            filters.brand = this.brandFilter.value;
        }
        if (this.typeFilter && this.typeFilter.value) {
            filters.body = this.typeFilter.value;
        }
        if (this.yearFilter && this.yearFilter.value) {
            filters.minYear = this.yearFilter.value;
        }
        if (this.statusFilter && this.statusFilter.value) {
            filters.status = this.statusFilter.value;
        }
        
        // Фильтры цен
        if (this.priceFrom && this.priceFrom.value) {
            filters.minPrice = parseInt(this.priceFrom.value) || 0;
        }
        if (this.priceTo && this.priceTo.value) {
            filters.maxPrice = parseInt(this.priceTo.value) || 10000000;
        }
        
        console.log('Применяемые фильтры:', filters);
        
        // Применяем фильтры
        this.searchCars(filters);
    }
    
    // Сброс фильтров
    handleFilterReset() {
        console.log('Сброс фильтров');
        
        // Сбрасываем значения фильтров
        if (this.brandFilter) this.brandFilter.value = '';
        if (this.typeFilter) this.typeFilter.value = '';
        if (this.yearFilter) this.yearFilter.value = '';
        if (this.statusFilter) this.statusFilter.value = '';
        if (this.priceFrom) this.priceFrom.value = '';
        if (this.priceTo) this.priceTo.value = '';
        if (this.searchInput) this.searchInput.value = '';
        
        // Сбрасываем текущие фильтры
        this.currentFilters = {};
        this.filteredCars = [...this.allCars];
        
        // Обновляем отображение
        this.displayCars(this.filteredCars);
        this.updateCarsCount(this.filteredCars.length);
        this.updateActiveFilters({});
    }
    
    // Поиск с фильтрами
    async searchCars(filters = {}) {
        try {
            this.showLoading(true);
            
            // Сохраняем фильтры
            this.currentFilters = { ...filters };
            
            // Создаем параметры запроса
            const queryParams = new URLSearchParams();
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
            
            const url = `/api/cars?${queryParams.toString()}`;
            console.log('Запрос поиска:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('Результаты поиска:', data);
            
            if (data.success) {
                this.filteredCars = data.cars || [];
                this.displayCars(this.filteredCars);
                this.updateCarsCount(this.filteredCars.length);
                this.updateActiveFilters(filters);
            } else {
                console.error('Ошибка поиска:', data.error);
                
                // Если поиск не сработал, показываем все автомобили
                this.filteredCars = [...this.allCars];
                this.displayCars(this.filteredCars);
                this.updateCarsCount(this.filteredCars.length);
                this.showError('Ошибка поиска: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            
            // Если произошла ошибка, показываем все автомобили
            this.filteredCars = [...this.allCars];
            this.displayCars(this.filteredCars);
            this.updateCarsCount(this.filteredCars.length);
            this.showError('Ошибка при выполнении поиска');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Просмотр деталей автомобиля
    viewCarDetails(carId) {
        console.log('Просмотр деталей автомобиля ID:', carId);
        // Перенаправляем на страницу с деталями
        window.location.href = `car-details.html?id=${carId}`;
    }
    
    // Обновление активных фильтров
    updateActiveFilters(filters) {
        if (!this.activeFilters) return;
        
        this.activeFilters.innerHTML = '';
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                const filterName = this.getFilterDisplayName(key, value);
                const tag = document.createElement('div');
                tag.className = 'active-filter-tag';
                tag.innerHTML = `
                    ${filterName}
                    <button type="button" data-filter="${key}">&times;</button>
                `;
                this.activeFilters.appendChild(tag);
            }
        });
        
        // Показываем/скрываем контейнер активных фильтров
        this.activeFilters.style.display = Object.keys(filters).filter(key => filters[key]).length > 0 ? 'flex' : 'none';
    }
    
    // Получение отображаемого имени фильтра
    getFilterDisplayName(key, value) {
        const filterNames = {
            'brand': 'Марка:',
            'body': 'Кузов:',
            'year': 'Год:',
            'status': 'Статус:',
            'minPrice': 'Цена от:',
            'maxPrice': 'Цена до:'
        };
        
        let displayValue = value;
        
        // Форматируем цену
        if (key === 'minPrice' || key === 'maxPrice') {
            displayValue = new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
        }
        
        return `${filterNames[key] || key} ${displayValue}`;
    }
    
    // Удаление отдельного фильтра
    removeFilter(filterKey) {
        delete this.currentFilters[filterKey];
        
        // Сбрасываем соответствующий элемент формы
        switch(filterKey) {
            case 'brand':
                if (this.brandFilter) this.brandFilter.value = '';
                break;
            case 'body':
                if (this.typeFilter) this.typeFilter.value = '';
                break;
            case 'minYear':
                if (this.yearFilter) this.yearFilter.value = '';
                break;
            case 'status':
                if (this.statusFilter) this.statusFilter.value = '';
                break;
            case 'minPrice':
                if (this.priceFrom) this.priceFrom.value = '';
                break;
            case 'maxPrice':
                if (this.priceTo) this.priceTo.value = '';
                break;
        }
        
        // Применяем оставшиеся фильтры
        this.searchCars(this.currentFilters);
    }
    
    // Обновление счетчика автомобилей
    updateCarsCount(count) {
        if (this.carsCount) {
            this.carsCount.textContent = count;
        }
        
        if (this.resultsInfo) {
            this.resultsInfo.style.display = count > 0 ? 'block' : 'none';
        }
    }
    
    // Показать/скрыть загрузку
    showLoading(show) {
        if (!this.carsGrid) return;
        
        if (show) {
            this.carsGrid.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Загрузка автомобилей...</p>
                </div>
            `;
        }
    }
    
    // Показать ошибку
    showError(message) {
        if (!this.carsGrid) return;
        
        this.carsGrid.innerHTML = `
            <div class="error-message">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn btn-small" onclick="window.carView.loadCars()">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем CarView...');
    window.carView = new CarView();
});

// Глобальная функция для обновления избранного после входа
window.updateCarFavorites = function() {
    if (window.carView) {
        window.carView.updateFavoritesOnLogin();
    }
};