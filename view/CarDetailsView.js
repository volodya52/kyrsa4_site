// CarDetailsView.js - Управление детальной страницей автомобиля

class CarDetailsView {
    constructor() {
        // Получаем ID автомобиля из URL
        this.urlParams = new URLSearchParams(window.location.search);
        this.carId = this.urlParams.get('id');
        
        // Элементы DOM
        this.carDetailsContent = document.getElementById('carDetailsContent');
        
        // Модальные окна
        this.testDriveModal = document.getElementById('testDriveModal');
        this.tradeInModal = document.getElementById('tradeInModal');
        this.buyModal = document.getElementById('buyModal');
        
        // Данные автомобиля
        this.car = null;
        
        // Инициализация
        this.init();
    }
    
    async init() {
        console.log('Инициализация CarDetailsView...');
        console.log('ID автомобиля:', this.carId);
        
        if (!this.carId) {
            this.showError('ID автомобиля не указан');
            return;
        }
        
        // Загружаем информацию об автомобиле
        await this.loadCarDetails();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
    }
    
    // Загрузка деталей автомобиля
    async loadCarDetails() {
        try {
            this.showLoading(true);
            
            console.log('Загружаем детали автомобиля ID:', this.carId);
            
            // Пробуем разные endpoints
            let endpoints = [
                `/api/cars/${this.carId}`,
                `/api/admin/cars`
            ];
            
            let carData = null;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (endpoint.includes('/cars/')) {
                            // Для endpoint с конкретным ID
                            if (data.success && data.car) {
                                carData = data.car;
                                break;
                            }
                        } else {
                            // Для endpoint со списком всех автомобилей
                            if (data.success && data.cars) {
                                const car = data.cars.find(c => c.id == this.carId || c.ID == this.carId);
                                if (car) {
                                    carData = car;
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`Ошибка при запросе к ${endpoint}:`, error.message);
                }
            }
            
            if (carData) {
                this.car = carData;
                console.log('Данные автомобиля загружены:', this.car);
                this.renderCarDetails();
            } else {
                this.showError('Автомобиль не найден');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки деталей автомобиля:', error);
            this.showError('Не удалось загрузить информацию об автомобиле');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Отображение деталей автомобиля
    renderCarDetails() {
        if (!this.car) {
            this.showError('Нет данных об автомобиле');
            return;
        }
        
        // Извлекаем данные
        const car = this.car;
        const id = car.id || car.ID || '';
        const brand = car.brand || car.Brand || 'Марка не указана';
        const model = car.model || car.Model || 'Модель не указана';
        const year = car.year || car.Year || '';
        const price = car.price || car.Price || 0;
        const mileage = car.mileage || car.Mileage || 0;
        const engineSize = car.engineSize || car.EngineSize || '';
        const horsepower = car.horsepower || car.Horsepower || '';
        const transmission = car.transmission || car.Transmission || '';
        const fuel = car.fuel || car.Fuel || '';
        const body = car.body || car.Body || '';
        const color = car.color || car.Color || '';
        const description = car.description || car.Description || 'Описание отсутствует';
        const status = car.status || car.Status || '';
        const imageUrl = car.image_url || car.Image_url || 'https://via.placeholder.com/800x400?text=Нет+фото';
        
        // Форматируем значения
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(price);
        const formattedMileage = mileage === 0 ? 'Новый' : `${mileage.toLocaleString('ru-RU')} км`;
        
        // Определяем цвет статуса
        let statusClass = '';
        let statusText = status;
        
        if (status.includes('наличи')) {
            statusClass = 'status-in-stock';
            statusText = 'В наличии';
        } else if (status.includes('Продан') || status.includes('продан')) {
            statusClass = 'status-sold';
            statusText = 'Продан';
        } else if (status.includes('Забронирован') || status.includes('забронирован')) {
            statusClass = 'status-reserved';
            statusText = 'Забронирован';
        }
        
        // Создаем HTML
        const html = `
            <div class="car-details-container">
                <div class="car-gallery">
                    <img src="${imageUrl}" 
                         alt="${brand} ${model}" 
                         class="car-main-image"
                         id="mainImage"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400?text=Ошибка+загрузки';">
                    
                    <div class="car-thumbnails">
                        <img src="${imageUrl}" 
                             alt="${brand} ${model}"
                             class="car-thumbnail active"
                             onclick="carDetailsView.changeMainImage('${imageUrl}', this)">
                    </div>
                </div>
                
                <div class="car-info-details">
                    <span class="car-status-badge ${statusClass}">${statusText}</span>
                    
                    <h1 class="car-title-large">${brand} ${model}</h1>
                    
                    <div class="car-meta">
                        <span>Год: ${year}</span>
                        <span>Кузов: ${body}</span>
                        <span>Цвет: ${color}</span>
                    </div>
                    
                    <div class="car-price-large">${formattedPrice} ₽</div>
                    
                    <div class="car-specifications">
                        <h3>Технические характеристики</h3>
                        <div class="spec-grid">
                            <div class="spec-item-detail">
                                <span class="spec-label">Двигатель:</span>
                                <span class="spec-value">${engineSize}L</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Мощность:</span>
                                <span class="spec-value">${horsepower} л.с.</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Коробка передач:</span>
                                <span class="spec-value">${transmission}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Топливо:</span>
                                <span class="spec-value">${fuel}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Пробег:</span>
                                <span class="spec-value">${formattedMileage}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Кузов:</span>
                                <span class="spec-value">${body}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Цвет:</span>
                                <span class="spec-value">${color}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span class="spec-label">Год выпуска:</span>
                                <span class="spec-value">${year}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="car-description">
                        <h3>Описание</h3>
                        <p class="car-description-full">${description}</p>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-test-drive" onclick="carDetailsView.openTestDriveModal()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            Тест-драйв
                        </button>
                        <button class="btn-trade-in" onclick="carDetailsView.openTradeInModal()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 7h7m0 0v7m0-7l-7 7-4-4-6 6"/>
                            </svg>
                            Trade-In
                        </button>
                        <button class="btn-buy" onclick="carDetailsView.openBuyModal()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                            </svg>
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.carDetailsContent.innerHTML = html;
    }
    
    // Изменение главного изображения
    changeMainImage(src, thumbnail) {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = src;
        }
        
        // Обновляем активную миниатюру
        document.querySelectorAll('.car-thumbnail').forEach(img => {
            img.classList.remove('active');
        });
        thumbnail.classList.add('active');
    }
    
    // Открытие модального окна тест-драйва
    openTestDriveModal() {
        if (!this.car) return;
        
        const brand = this.car.brand || this.car.Brand || '';
        const model = this.car.model || this.car.Model || '';
        
        document.getElementById('testDriveCarInfo').textContent = 
            `Вы записываетесь на тест-драйв ${brand} ${model}`;
        
        // Устанавливаем минимальную дату (завтра)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        document.getElementById('testDriveDate').min = minDate;
        
        this.testDriveModal.style.display = 'flex';
    }
    
    // Открытие модального окна Trade-In
    openTradeInModal() {
        if (!this.car) return;
        
        const brand = this.car.brand || this.car.Brand || '';
        const model = this.car.model || this.car.Model || '';
        const price = this.car.price || this.car.Price || 0;
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(price);
        
        document.getElementById('tradeInCarInfo').textContent = 
            `Вы подаете заявку на Trade-In для покупки ${brand} ${model} за ${formattedPrice} ₽`;
        
        this.tradeInModal.style.display = 'flex';
    }
    
    // Открытие модального окна покупки
    openBuyModal() {
        if (!this.car) return;
        
        const brand = this.car.brand || this.car.Brand || '';
        const model = this.car.model || this.car.Model || '';
        const price = this.car.price || this.car.Price || 0;
        const formattedPrice = new Intl.NumberFormat('ru-RU').format(price);
        
        document.getElementById('buyCarInfo').textContent = 
            `Вы оформляете заявку на покупку ${brand} ${model} за ${formattedPrice} ₽`;
        
        this.buyModal.style.display = 'flex';
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Закрытие модальных окон
        const closeButtons = [
            { element: 'closeTestDriveModal', modal: this.testDriveModal },
            { element: 'closeTradeInModal', modal: this.tradeInModal },
            { element: 'closeBuyModal', modal: this.buyModal }
        ];
        
        closeButtons.forEach(({ element, modal }) => {
            const closeBtn = document.getElementById(element);
            if (closeBtn && modal) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
        });
        
        // Кнопки отмены
        const cancelButtons = [
            { element: 'cancelTestDriveBtn', modal: this.testDriveModal },
            { element: 'cancelTradeInBtn', modal: this.tradeInModal },
            { element: 'cancelBuyBtn', modal: this.buyModal }
        ];
        
        cancelButtons.forEach(({ element, modal }) => {
            const cancelBtn = document.getElementById(element);
            if (cancelBtn && modal) {
                cancelBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
        });
        
        // Подтверждение тест-драйва
        const confirmTestDriveBtn = document.getElementById('confirmTestDriveBtn');
        if (confirmTestDriveBtn) {
            confirmTestDriveBtn.addEventListener('click', () => this.submitTestDrive());
        }
        
        // Подтверждение Trade-In
        const confirmTradeInBtn = document.getElementById('confirmTradeInBtn');
        if (confirmTradeInBtn) {
            confirmTradeInBtn.addEventListener('click', () => this.submitTradeIn());
        }
        
        // Подтверждение покупки
        const confirmBuyBtn = document.getElementById('confirmBuyBtn');
        if (confirmBuyBtn) {
            confirmBuyBtn.addEventListener('click', () => this.submitBuy());
        }
        
        // Закрытие по клику вне модального окна
        [this.testDriveModal, this.tradeInModal, this.buyModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }
    
    // Отправка заявки на тест-драйв
    async submitTestDrive() {
        const formData = {
            name: document.getElementById('testDriveName').value,
            phone: document.getElementById('testDrivePhone').value,
            email: document.getElementById('testDriveEmail').value,
            date: document.getElementById('testDriveDate').value,
            time: document.getElementById('testDriveTime').value,
            message: document.getElementById('testDriveMessage').value,
            carId: this.carId,
            carBrand: this.car.brand || this.car.Brand,
            carModel: this.car.model || this.car.Model
        };
        
        // Валидация
        if (!formData.name || !formData.phone || !formData.email || !formData.date || !formData.time) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        try {
            // Отправляем запрос на сервер
            const response = await fetch('/api/test-drive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Заявка на тест-драйв успешно отправлена! Мы свяжемся с вами в ближайшее время.');
                this.testDriveModal.style.display = 'none';
                this.clearTestDriveForm();
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка отправки заявки:', error);
            alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
        }
    }
    
    // Отправка заявки на Trade-In
    async submitTradeIn() {
        const formData = {
            userCarBrand: document.getElementById('tradeInBrand').value,
            userCarModel: document.getElementById('tradeInModel').value,
            userCarYear: document.getElementById('tradeInYear').value,
            userCarMileage: document.getElementById('tradeInMileage').value,
            userCarCondition: document.getElementById('tradeInCondition').value,
            name: document.getElementById('tradeInName').value,
            phone: document.getElementById('tradeInPhone').value,
            email: document.getElementById('tradeInEmail').value,
            message: document.getElementById('tradeInMessage').value,
            carId: this.carId,
            carBrand: this.car.brand || this.car.Brand,
            carModel: this.car.model || this.car.Model
        };
        
        // Валидация
        if (!formData.userCarBrand || !formData.userCarModel || !formData.userCarYear || 
            !formData.userCarMileage || !formData.userCarCondition || !formData.name || 
            !formData.phone || !formData.email) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        try {
            // Отправляем запрос на сервер
            const response = await fetch('/api/trade-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Заявка на Trade-In успешно отправлена! Мы свяжемся с вами для оценки вашего автомобиля.');
                this.tradeInModal.style.display = 'none';
                this.clearTradeInForm();
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка отправки заявки:', error);
            alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
        }
    }
    
    // Отправка заявки на покупку
    async submitBuy() {
        const formData = {
            name: document.getElementById('buyName').value,
            phone: document.getElementById('buyPhone').value,
            email: document.getElementById('buyEmail').value,
            paymentMethod: document.getElementById('buyPaymentMethod').value,
            message: document.getElementById('buyMessage').value,
            carId: this.carId,
            carBrand: this.car.brand || this.car.Brand,
            carModel: this.car.model || this.car.Model
        };
        
        // Валидация
        if (!formData.name || !formData.phone || !formData.email || !formData.paymentMethod) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        try {
            // Отправляем запрос на сервер
            const response = await fetch('/api/buy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Заявка на покупку успешно отправлена! Наш менеджер свяжется с вами для оформления сделки.');
                this.buyModal.style.display = 'none';
                this.clearBuyForm();
            } else {
                alert('Ошибка: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка отправки заявки:', error);
            alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
        }
    }
    
    // Очистка формы тест-драйва
    clearTestDriveForm() {
        document.getElementById('testDriveName').value = '';
        document.getElementById('testDrivePhone').value = '';
        document.getElementById('testDriveEmail').value = '';
        document.getElementById('testDriveDate').value = '';
        document.getElementById('testDriveTime').value = '';
        document.getElementById('testDriveMessage').value = '';
    }
    
    // Очистка формы Trade-In
    clearTradeInForm() {
        document.getElementById('tradeInBrand').value = '';
        document.getElementById('tradeInModel').value = '';
        document.getElementById('tradeInYear').value = '';
        document.getElementById('tradeInMileage').value = '';
        document.getElementById('tradeInCondition').value = '';
        document.getElementById('tradeInName').value = '';
        document.getElementById('tradeInPhone').value = '';
        document.getElementById('tradeInEmail').value = '';
        document.getElementById('tradeInMessage').value = '';
    }
    
    // Очистка формы покупки
    clearBuyForm() {
        document.getElementById('buyName').value = '';
        document.getElementById('buyPhone').value = '';
        document.getElementById('buyEmail').value = '';
        document.getElementById('buyPaymentMethod').value = '';
        document.getElementById('buyMessage').value = '';
    }
    
    // Показать загрузку
    showLoading(show) {
        if (!this.carDetailsContent) return;
        
        if (show) {
            this.carDetailsContent.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Загрузка информации об автомобиле...</p>
                </div>
            `;
        }
    }
    
    // Показать ошибку
    showError(message) {
        if (!this.carDetailsContent) return;
        
        this.carDetailsContent.innerHTML = `
            <div class="error-message">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <a href="cars.html" class="btn btn-small">Вернуться в каталог</a>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализируем CarDetailsView...');
    window.carDetailsView = new CarDetailsView();
});