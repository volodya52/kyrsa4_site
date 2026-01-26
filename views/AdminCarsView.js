// AdminCarsView.js - UPDATED FOR MVC
document.addEventListener('DOMContentLoaded', function() {
    // Элементы страницы
    const adminContent = document.getElementById('adminContent');
    const accessDenied = document.getElementById('accessDenied');
    const carsTableContainer = document.getElementById('carsTableContainer');
    
    // Элементы модальных окон
    const carModal = document.getElementById('carModal');
    const deleteCarModal = document.getElementById('deleteCarModal');
    const addCarBtn = document.getElementById('addCarBtn');
    const closeCarModal = document.getElementById('closeCarModal');
    const closeDeleteCarModal = document.getElementById('closeDeleteCarModal');
    const cancelCarBtn = document.getElementById('cancelCarBtn');
    const cancelDeleteCarBtn = document.getElementById('cancelDeleteCarBtn');
    const saveCarBtn = document.getElementById('saveCarBtn');
    const confirmDeleteCarBtn = document.getElementById('confirmDeleteCarBtn');
    const carForm = document.getElementById('carForm');
    
    // Initialize Controllers and Models
    const carController = new CarController();
    const userModel = new UserModel();
    
    // Переменные для хранения состояния
    let currentCar = null;
    let carToDelete = null;
    let currentCars = [];
    
    // Проверяем, является ли пользователь администратором через модель
    function checkAdminAccess() {
        return userModel.isAdmin();
    }
    
    // Показываем сообщение об ошибке
    function showError(message) {
        console.error('Ошибка:', message);
        carsTableContainer.innerHTML = `
            <div class="no-data error-message">
                <p>❌ ${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Повторить</button>
            </div>
        `;
    }
    
    // Показываем сообщение об отсутствии автомобилей
    function showNoCars() {
        carsTableContainer.innerHTML = `
            <div class="no-data">
                <p>🚗 Автомобили не найдены</p>
                <p>Добавьте первый автомобиль</p>
            </div>
        `;
    }
    
    // Загружаем список автомобилей
    async function loadCars() {
        console.log('Loading cars for admin...');
        carsTableContainer.innerHTML = '<div class="loading">Загрузка автомобилей...</div>';
        
        try {
            // Используем контроллер для получения автомобилей
            const cars = await carController.getAllCars();
            
            if (!cars || !Array.isArray(cars)) {
                throw new Error('Некорректный формат данных');
            }
            
            currentCars = cars;
            console.log(`Загружено ${cars.length} автомобилей`);
            
            if (cars.length === 0) {
                showNoCars();
            } else {
                renderCarsTable(cars);
            }
        } catch (error) {
            console.error('Ошибка загрузки автомобилей:', error);
            
            // Проверяем, есть ли локально сохраненные данные
            try {
                const localCars = carController.getLocalCars();
                if (localCars && localCars.length > 0) {
                    console.log('Используем локально сохраненные автомобили');
                    currentCars = localCars;
                    renderCarsTable(localCars);
                    showError('Используются локальные данные. Нет связи с сервером.');
                    return;
                }
            } catch (localError) {
                console.warn('Не удалось загрузить локальные данные:', localError);
            }
            
            showError('Ошибка загрузки автомобилей: ' + error.message);
        }
    }
    
    // Отображаем таблицу автомобилей
    function renderCarsTable(cars) {
        if (!Array.isArray(cars)) {
            console.error('Ошибка: cars не является массивом:', cars);
            carsTableContainer.innerHTML = `
                <div class="no-data">
                    <p>Ошибка: получены некорректные данные</p>
                    <button class="btn btn-primary" onclick="loadCars()">Повторить</button>
                </div>
            `;
            return;
        }
        
        if (cars.length === 0) {
            showNoCars();
            return;
        }
        
        let tableHTML = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Изображение</th>
                        <th>Марка и модель</th>
                        <th>Год</th>
                        <th>Цена</th>
                        <th>Пробег</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        cars.forEach(car => {
            if (!car || typeof car !== 'object') {
                console.warn('Некорректный автомобиль:', car);
                return;
            }
            
            // Проверяем и форматируем данные
            const carId = car.id || car._id || 'N/A';
            const brand = car.brand || 'Не указана';
            const model = car.model || 'Не указана';
            const year = car.year || 'N/A';
            const price = car.price || 0;
            const mileage = car.mileage || 0;
            const status = car.status || 'new';
            
            const priceFormatted = new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
            const mileageFormatted = mileage ? new Intl.NumberFormat('ru-RU').format(mileage) + ' км' : '0 км';
            const statusText = status === 'new' ? 'Новый' : 'С пробегом';
            const statusClass = status === 'new' ? 'role-admin' : 'role-user';
            
            // Получаем URL изображения с проверкой
            let imageUrl = 'https://via.placeholder.com/100x60?text=Автомобиль';
            if (car.image) {
                imageUrl = car.image;
            } else if (car.image_url) {
                imageUrl = car.image_url;
            } else if (car.images && car.images.length > 0) {
                imageUrl = car.images[0];
            }
            
            tableHTML += `
                <tr>
                    <td>${carId}</td>
                    <td>
                        <img src="${imageUrl}" 
                             alt="${brand} ${model}" 
                             style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px;"
                             onerror="this.src='https://via.placeholder.com/100x60?text=Автомобиль'">
                    </td>
                    <td>
                        <strong>${brand}</strong><br>
                        ${model}
                    </td>
                    <td>${year}</td>
                    <td><strong>${priceFormatted}</strong></td>
                    <td>${mileageFormatted}</td>
                    <td>
                        <span class="role-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="user-actions">
                            <button class="btn btn-warning btn-icon" onclick="editCar(${carId})">
                                Редактировать
                            </button>
                            <button class="btn btn-danger btn-icon" onclick="confirmDeleteCar(${carId}, '${brand} ${model}')">
                                Удалить
                            </button>
                            <button class="btn btn-small" onclick="viewInCatalog(${carId})" style="margin-top: 5px;">
                                В каталог
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
        
        carsTableContainer.innerHTML = tableHTML;
    }
    
    // Открываем модальное окно для добавления автомобиля
    function openAddCarModal() {
        currentCar = null;
        document.getElementById('carModalTitle').textContent = 'Добавить автомобиль';
        carForm.reset();
        
        // Устанавливаем значения по умолчанию
        const currentYear = new Date().getFullYear();
        document.getElementById('carYear').value = currentYear;
        document.getElementById('carStatus').value = 'new';
        document.getElementById('carTransmission').value = 'Автомат';
        document.getElementById('carFuel').value = 'Бензин';
        document.getElementById('carBody').value = 'Седан';
        document.getElementById('carColor').value = 'Черный';
        document.getElementById('carMileage').value = 0;
        document.getElementById('carHorsepower').value = 150;
        document.getElementById('carEngine').value = '2.0';
        
        carModal.style.display = 'flex';
    }
    
    // Открываем модальное окно для редактирования автомобиля
    window.editCar = async function(carId) {
    try {
        const car = await carController.getCarDetails(carId);
        
        if (!car) {
            throw new Error('Автомобиль не найден');
        }
        
        currentCar = car;
        
        document.getElementById('carModalTitle').textContent = 'Редактировать автомобиль';
        document.getElementById('carId').value = car.id || car._id || '';
        document.getElementById('carBrand').value = car.brand || '';
        document.getElementById('carModel').value = car.model || '';
        document.getElementById('carYear').value = car.year || new Date().getFullYear();
        document.getElementById('carPrice').value = car.price || '';
        document.getElementById('carMileage').value = car.mileage || 0;
        document.getElementById('carEngine').value = car.engine_size || car.engineSize || car.engine || ''; // Учитываем разные названия полей
        document.getElementById('carHorsepower').value = car.horsepower || '';
        document.getElementById('carTransmission').value = car.transmission || 'Автомат';
        document.getElementById('carFuel').value = car.fuel || 'Бензин';
        document.getElementById('carBody').value = car.body || 'Седан';
        document.getElementById('carColor').value = car.color || '';
        document.getElementById('carStatus').value = car.status || 'new';
        // Используем image_url если есть, иначе image
        document.getElementById('carImage').value = car.image_url || car.image || '';
        document.getElementById('carDescription').value = car.description || '';
        
        carModal.style.display = 'flex';
    } catch (error) {
        console.error('Ошибка загрузки данных автомобиля:', error);
        alert('Ошибка загрузки данных автомобиля: ' + error.message);
    }
}
    
    // Подтверждение удаления автомобиля
    window.confirmDeleteCar = function(carId, carName) {
        carToDelete = carId;
        // Экранируем кавычки в имени автомобиля
        const safeCarName = carName.replace(/'/g, "\\'");
        document.getElementById('deleteCarMessage').textContent = 
            `Вы действительно хотите удалить автомобиль "${safeCarName}"? Это действие нельзя отменить.`;
        deleteCarModal.style.display = 'flex';
    }
    
    // Сохранение автомобиля
   async function saveCar() {
        const carData = {
            brand: document.getElementById('carBrand').value.trim(),
            model: document.getElementById('carModel').value.trim(),
            year: parseInt(document.getElementById('carYear').value),
            price: parseInt(document.getElementById('carPrice').value),
            mileage: parseInt(document.getElementById('carMileage').value) || 0,
            engine_size: document.getElementById('carEngine').value.trim(), // было engineSize
            horsepower: parseInt(document.getElementById('carHorsepower').value) || 0,
            transmission: document.getElementById('carTransmission').value,
            fuel: document.getElementById('carFuel').value,
            body: document.getElementById('carBody').value,
            color: document.getElementById('carColor').value.trim(),
            status: document.getElementById('carStatus').value,
            image_url: document.getElementById('carImage').value.trim(), // БЫЛО: image, СТАЛО: image_url
            description: document.getElementById('carDescription').value.trim()
        };
        
        // Валидация
        if (!carData.brand || !carData.model || !carData.year || !carData.price) {
            alert('Пожалуйста, заполните обязательные поля (Марка, Модель, Год, Цена)');
            return;
        }
    
        
        if (carData.price < 0) {
            alert('Цена не может быть отрицательной');
            return;
        }
        
       
        
        // Если нет изображения, используем заглушку
        if (!carData.image_url) {
            carData.image_url = 'https://via.placeholder.com/400x300?text=Автомобиль';
        }
        
        try {
            let result;
            const carId = currentCar ? (currentCar.id || currentCar._id) : null;
            
            console.log('Отправка данных автомобиля:', carData); // Для отладки
            
            if (carId) {
                // Обновление существующего автомобиля
                result = await carController.saveCar(carData, carId);
            } else {
                // Добавление нового автомобиля
                result = await carController.saveCar(carData);
            }
            
            console.log('Результат сохранения:', result); // Для отладки
            
            if (result && result.success !== false) {
                closeModal(carModal);
                loadCars();
                showSuccessMessage(
                    carId ? 
                    'Автомобиль успешно обновлен!' : 
                    'Автомобиль успешно добавлен!'
                );
                
                currentCar = null;
            } else {
                throw new Error(result?.error || 'Ошибка сохранения автомобиля');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения автомобиля:', error);
            alert('Ошибка сохранения автомобиля: ' + error.message);
        }
    }
    
    // Удаление автомобиля
    async function deleteCar() {
        if (!carToDelete) return;
        
        try {
            const result = await carController.deleteCar(carToDelete);
            
            if (result && result.success !== false) {
                closeModal(deleteCarModal);
                loadCars();
                showSuccessMessage('Автомобиль успешно удален!');
                carToDelete = null;
            } else {
                throw new Error(result?.error || 'Ошибка удаления автомобиля');
            }
        } catch (error) {
            console.error('Ошибка удаления автомобиля:', error);
            alert('Ошибка удаления автомобиля: ' + error.message);
        }
    }
    
    // Просмотр в каталоге
    window.viewInCatalog = function(carId) {
        window.location.href = `car-details.html?id=${carId}`;
    };
    
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
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
    }
    
    // Инициализация
    function initAdminPage() {
        if (!checkAdminAccess()) {
            adminContent.style.display = 'none';
            accessDenied.style.display = 'block';
            return;
        }
        
        // Загружаем автомобили
        loadCars();
        
        // Назначаем обработчики событий
        addCarBtn.addEventListener('click', openAddCarModal);
        closeCarModal.addEventListener('click', () => closeModal(carModal));
        closeDeleteCarModal.addEventListener('click', () => closeModal(deleteCarModal));
        cancelCarBtn.addEventListener('click', () => closeModal(carModal));
        cancelDeleteCarBtn.addEventListener('click', () => closeModal(deleteCarModal));
        saveCarBtn.addEventListener('click', saveCar);
        confirmDeleteCarBtn.addEventListener('click', deleteCar);
        
        // Закрытие модальных окон при клике вне их
        window.addEventListener('click', (event) => {
            if (event.target === carModal) {
                closeModal(carModal);
            }
            if (event.target === deleteCarModal) {
                closeModal(deleteCarModal);
            }
        });
        
        // Отправка формы по Enter
        carForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveCarBtn.click();
            }
        });
    }
    
    // Запуск инициализации
    initAdminPage();
});