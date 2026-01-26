// CarView.js - UPDATED FOR MVC
class CarView {
    constructor() {
        // Основные элементы DOM
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
        
        // Initialize Controllers and Models
        this.carController = new CarController();
        this.carController.setView(this);
        this.userModel = new UserModel();
        this.favoriteController = new FavoriteController();
        
        // Данные
        this.allCars = [];
        this.filteredCars = [];
        this.currentFilters = {};
        this.favoriteCars = new Set();
        this.searchTimeout = null;
        
        // Инициализация
        this.init();
    }
    
    async init() {
        console.log('Инициализация CarView...');
        
        // Загружаем данные через контроллер
        await this.loadCars();
        
        // Загружаем избранное если пользователь авторизован
        if (this.userModel.getCurrentUser()) {
            await this.loadUserFavorites();
        }
        
        // Настраиваем интерфейс
        this.initFilters();
        this.setupEventListeners();
        
        // Показываем результаты
        this.displayResults();
    }
    
    // ==================== ЗАГРУЗКА ДАННЫХ ====================
    
    async loadCars() {
        try {
            this.showLoading(true);
            this.allCars = await this.carController.loadCars();
            console.log(`Загружено ${this.allCars.length} автомобилей`);
            
            // Инициализируем фильтры
            this.initializeFilters();
            // Показываем все автомобили
            this.filteredCars = [...this.allCars];
            this.displayResults();
            this.updateCarsCount(this.filteredCars.length);
        } catch (error) {
            console.error('Ошибка загрузки автомобилей:', error);
            this.showError('Не удалось загрузить автомобили');
        } finally {
            this.showLoading(false);
        }
    }
    
    async loadUserFavorites() {
        try {
            const favorites = await this.favoriteController.getFavorites();
            favorites.forEach(car => {
                this.favoriteCars.add(car.id);
            });
            console.log('Избранное загружено:', this.favoriteCars);
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
        }
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ ====================
    
    initializeFilters() {
        this.populateBrandFilter();
        this.populateYearFilter();
        this.populateTypeFilter();
        this.populateStatusFilter();
        this.setupPriceFilters();
    }
    
    populateBrandFilter() {
        if (!this.brandFilter) return;
        
        const brands = new Set();
        this.allCars.forEach(car => {
            const brand = car.brand || car.Brand;
            if (brand) brands.add(brand);
        });
        
        const sortedBrands = Array.from(brands).sort();
        this.brandFilter.innerHTML = '<option value="">Все марки</option>';
        
        sortedBrands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            this.brandFilter.appendChild(option);
        });
    }
    
    populateYearFilter() {
        if (!this.yearFilter) return;
        
        const years = new Set();
        this.allCars.forEach(car => {
            const year = car.year || car.Year;
            if (year) years.add(year);
        });
        
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        this.yearFilter.innerHTML = '<option value="">Любой год</option>';
        
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.yearFilter.appendChild(option);
        });
    }
    
    populateTypeFilter() {
        if (!this.typeFilter) return;
        
        const types = new Set();
        this.allCars.forEach(car => {
            const type = car.body || car.Body;
            if (type) types.add(type);
        });
        
        const sortedTypes = Array.from(types).sort();
        this.typeFilter.innerHTML = '<option value="">Все типы</option>';
        
        sortedTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = this.getBodyTypeDisplayName(type);
            this.typeFilter.appendChild(option);
        });
    }
    
    populateStatusFilter() {
        if (!this.statusFilter) return;
        
        const statuses = new Set();
        this.allCars.forEach(car => {
            const status = car.status || car.Status;
            if (status) statuses.add(status);
        });
        
        const sortedStatuses = Array.from(statuses).sort();
        this.statusFilter.innerHTML = '<option value="">Все статусы</option>';
        
        sortedStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = this.getStatusDisplayName(status);
            this.statusFilter.appendChild(option);
        });
    }
    
    setupPriceFilters() {
        if (!this.priceFrom || !this.priceTo) return;
        
        // Находим минимальную и максимальную цены
        let minPrice = Infinity;
        let maxPrice = 0;
        
        this.allCars.forEach(car => {
            const price = car.price || car.Price || 0;
            if (price < minPrice) minPrice = price;
            if (price > maxPrice) maxPrice = price;
        });
        
        // Если цены не найдены, устанавливаем разумные значения по умолчанию
        if (minPrice === Infinity) minPrice = 0;
        if (maxPrice === 0) maxPrice = 10000000;
        
        // Устанавливаем placeholder
        this.priceFrom.placeholder = `От ${minPrice.toLocaleString('ru-RU')} ₽`;
        this.priceTo.placeholder = `До ${maxPrice.toLocaleString('ru-RU')} ₽`;
    }
    
    // ==================== ПОИСК И ФИЛЬТРАЦИЯ ====================
    
    searchCars(searchTerm = '') {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(async () => {
            try {
                this.showLoading(true);
                
                // Собираем все фильтры
                const filters = this.collectFilters();
                
                // Фильтруем через контроллер
                this.filteredCars = await this.carController.filterCars(filters);
                
                this.updateActiveFilters(filters);
                this.displayResults();
                
            } catch (error) {
                console.error('Ошибка поиска:', error);
                this.showError('Ошибка при выполнении поиска');
            } finally {
                this.showLoading(false);
            }
        }, 300);
    }
    
    collectFilters() {
    const filters = {};
    
    // Текстовый поиск
    if (this.searchInput && this.searchInput.value.trim()) {
        filters.search = this.searchInput.value.trim();
    }
    
    // Марка
    if (this.brandFilter && this.brandFilter.value) {
        filters.brand = this.brandFilter.value;
    }
    
    // Тип кузова
    if (this.typeFilter && this.typeFilter.value) {
        filters.body = this.typeFilter.value;
    }
    
    // Год выпуска
    if (this.yearFilter && this.yearFilter.value) {
        filters.year = this.yearFilter.value; // Изменено с minYear на year
    }
    
    // Статус
    if (this.statusFilter && this.statusFilter.value) {
        filters.status = this.statusFilter.value;
    }
    
    // Цена от
    if (this.priceFrom && this.priceFrom.value) {
        filters.minPrice = parseInt(this.priceFrom.value) || 0;
    }
    
    // Цена до
    if (this.priceTo && this.priceTo.value) {
        filters.maxPrice = parseInt(this.priceTo.value) || 100000000;
    }
    
    return filters;
}
    
    // ==================== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ====================
    
    displayResults() {
        if (!this.carsGrid) return;
        
        // Обновляем счетчик
        this.updateCarsCount(this.filteredCars.length);
        
        if (this.filteredCars.length === 0) {
            this.showNoResults();
            return;
        }
        
        // Создаем HTML для всех автомобилей
        let html = '';
        this.filteredCars.forEach(car => {
            html += this.createCarCard(car);
        });
        
        this.carsGrid.innerHTML = html;
    }
    
    createCarCard(car) {
        console.log('Создание карточки для:', car);
        
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
        
        // Форматируем значения
        const formattedPrice = price ? new Intl.NumberFormat('ru-RU').format(price) : 'Цена не указана';
        const formattedMileage = mileage === 0 ? 'Новый' : `${mileage.toLocaleString('ru-RU')} км`;
        const bodyTypeDisplay = this.getBodyTypeDisplayName(body);
        
        return `
            <div class="car-card" data-id="${id}" style="min-height: 420px;">
                <div class="car-image">
                    <img src="${imageUrl}" 
                         alt="${brand} ${model}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Ошибка+загрузки';">
                    ${status ? `<span class="car-badge ${this.getStatusClass(status)}">${this.getStatusDisplayName(status)}</span>` : ''}
                    
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
                    <!-- Уменьшенный заголовок -->
                    <h3 class="car-title" style="font-size: 18px; margin-bottom: 8px; min-height: 44px;">${brand} ${model}</h3>
                    <p class="car-description" style="font-size: 14px; color: var(--color-text-light); margin-bottom: 12px;">
                        ${year ? year + ' год' : ''} 
                        ${bodyTypeDisplay ? ' • ' + bodyTypeDisplay : ''}
                        ${transmission ? ' • ' + transmission : ''}
                    </p>
                    <div class="car-specs" style="margin-bottom: 15px;">
                        ${engineSize ? `<span class="spec-item">${engineSize}L</span>` : ''}
                        ${horsepower ? `<span class="spec-item">${horsepower} л.с.</span>` : ''}
                        <span class="spec-item">${formattedMileage}</span>
                    </div>
                    <div class="car-footer" style="margin-top: auto;">
                        <div class="car-price" style="font-size: 20px; font-weight: 700; margin-bottom: 10px;">${formattedPrice} ₽</div>
                        <button class="btn btn-small view-details" data-id="${id}" 
                                onclick="window.carView.viewCarDetails(${id})"
                                style="width: 100%;">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== УПРАВЛЕНИЕ ФИЛЬТРАМИ ====================
    
    updateActiveFilters(filters) {
        if (!this.activeFilters) return;
        
        this.activeFilters.innerHTML = '';
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '' && key !== 'search') {
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
        
        // Показываем только если есть активные фильтры
        this.activeFilters.style.display = Object.keys(filters).filter(
            key => filters[key] && key !== 'search'
        ).length > 0 ? 'flex' : 'none';
    }
    
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
        this.handleFilterApply();
    }
    
    resetAllFilters() {
        console.log('Сброс всех фильтров');
        
        // Сбрасываем все элементы формы
        if (this.searchInput) this.searchInput.value = '';
        if (this.brandFilter) this.brandFilter.value = '';
        if (this.typeFilter) this.typeFilter.value = '';
        if (this.yearFilter) this.yearFilter.value = '';
        if (this.statusFilter) this.statusFilter.value = '';
        if (this.priceFrom) this.priceFrom.value = '';
        if (this.priceTo) this.priceTo.value = '';
        
        // Сбрасываем внутреннее состояние
        this.currentFilters = {};
        this.filteredCars = [...this.allCars];
        
        // Обновляем отображение
        this.displayResults();
        this.updateActiveFilters({});
        this.updateCarsCount(this.filteredCars.length);
    }
    
    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    
    initFilters() {
        if (this.priceTo) {
            this.priceTo.placeholder = '10000000';
        }
    }
    
    setupEventListeners() {
        // Поиск по Enter
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
            
            // Инкрементальный поиск при вводе
            this.searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                if (searchTerm.length >= 2 || searchTerm.length === 0) {
                    this.searchCars(searchTerm);
                }
            });
        }
        
        // Кнопка поиска
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
        
        // Автоматическое применение фильтров при изменении
        const filterElements = [this.brandFilter, this.typeFilter, this.yearFilter, this.statusFilter];
        filterElements.forEach(element => {
            if (element) {
                element.addEventListener('change', () => this.handleFilterApply());
            }
        });
        
        // Фильтры цен
        const priceElements = [this.priceFrom, this.priceTo];
        priceElements.forEach(element => {
            if (element) {
                element.addEventListener('change', () => this.handleFilterApply());
                element.addEventListener('blur', () => this.handleFilterApply());
            }
        });
        
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
    
    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        console.log('Поиск по запросу:', searchTerm);
        this.searchCars(searchTerm);
    }
    
    handleFilterApply() {
        console.log('Применение фильтров');
        const filters = this.collectFilters();
        this.currentFilters = filters;
        this.searchCars();
    }
    
    handleFilterReset() {
        this.resetAllFilters();
    }
    
    // ==================== УПРАВЛЕНИЕ ИЗБРАННЫМ ====================
    
    async toggleFavorite(carId, carName, button) {
        const result = await this.carController.toggleFavorite(carId, carName);
        
        if (result.requiresLogin) {
            this.showLoginPrompt();
            return;
        }
        
        if (result.success) {
            // Обновляем состояние избранного
            if (result.isFavorite) {
                this.favoriteCars.add(carId);
            } else {
                this.favoriteCars.delete(carId);
            }
            
            // Обновляем кнопку
            this.updateFavoriteButton(button, result.isFavorite);
            this.showNotification(result.message, 'success');
            
            // Обновляем отображение всех карточек
            this.displayResults();
        } else {
            this.showNotification(result.error || 'Ошибка', 'error');
        }
    }
    
    updateFavoriteButton(button, isFavorite) {
        const svg = button.querySelector('svg');
        if (svg) {
            svg.style.fill = isFavorite ? '#ff4757' : 'none';
            svg.style.stroke = isFavorite ? '#ff4757' : '#666';
        }
        
        if (isFavorite) {
            button.classList.add('active');
            button.title = 'Удалить из избранного';
        } else {
            button.classList.remove('active');
            button.title = 'Добавить в избранное';
        }
        
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 300);
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================
    
    getFilterDisplayName(key, value) {
        const filterNames = {
            'brand': 'Марка:',
            'body': 'Кузов:',
            'minYear': 'Год:',
            'status': 'Статус:',
            'minPrice': 'Цена от:',
            'maxPrice': 'Цена до:'
        };
        
        let displayValue = value;
        
        if (key === 'minPrice' || key === 'maxPrice') {
            displayValue = new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
        }
        
        return `${filterNames[key] || key} ${displayValue}`;
    }
    
    getStatusDisplayName(status) {
        const statusMap = {
            'new': 'Новый',
            'used': 'С пробегом',
            'В наличии': 'В наличии',
            'Продано': 'Продано',
            'На заказ': 'На заказ',
            'Новый': 'Новый',
            'С пробегом': 'С пробегом'
        };
        return statusMap[status] || status;
    }
    
    getStatusClass(status) {
        const statusClassMap = {
            'new': 'badge-featured',
            'used': 'status-used',
            'В наличии': 'status-in-stock',
            'Продано': 'status-sold',
            'На заказ': 'status-preorder',
            'Новый': 'badge-featured',
            'С пробегом': 'status-used'
        };
        return statusClassMap[status] || 'status-default';
    }
    
    getBodyTypeDisplayName(bodyType) {
        const bodyTypeMap = {
            'sedan': 'Седан',
            'suv': 'Внедорожник',
            'hatchback': 'Хэтчбек',
            'coupe': 'Купе',
            'universal': 'Универсал',
            'cabriolet': 'Кабриолет',
            'pickup': 'Пикап',
            'Седан': 'Седан',
            'Внедорожник': 'Внедорожник',
            'Хэтчбек': 'Хэтчбек',
            'Купе': 'Купе'
        };
        return bodyTypeMap[bodyType] || bodyType;
    }
    
    showLoginPrompt() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'flex';
            return;
        }
        
        if (confirm('Чтобы добавить в избранное, нужно войти в систему. Перейти к авторизации?')) {
            window.location.href = 'index.html#login';
        }
    }
    
    showNotification(message, type = 'success') {
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
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
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
    
    showNoResults() {
        this.carsGrid.innerHTML = `
            <div class="no-results">
                <h3>Автомобили не найдены</h3>
                <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
                <button class="btn" onclick="window.carView.resetAllFilters()">
                    Сбросить фильтры
                </button>
            </div>
        `;
    }
    
    showError(message) {
        if (!this.carsGrid) return;
        
        this.carsGrid.innerHTML = `
            <div class="search-error">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn btn-small" onclick="window.carView.loadCars()">
                    Попробовать снова
                </button>
            </div>
        `;
    }
    
    updateCarsCount(count) {
        if (this.carsCount) {
            this.carsCount.textContent = count;
        }
        
        if (this.resultsInfo) {
            this.resultsInfo.style.display = count > 0 ? 'block' : 'none';
        }
    }
    
    viewCarDetails(carId) {
        window.location.href = `car-details.html?id=${carId}`;
    }
    
    updateFavoritesOnLogin() {
        if (this.userModel.getCurrentUser()) {
            this.loadUserFavorites().then(() => {
                this.displayResults();
            });
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем CarView...');
    window.carView = new CarView();
});