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
    
    // Переменные для хранения состояния
    let currentCar = null;
    let carToDelete = null;
    
    // Проверяем, является ли пользователь администратором
    function checkAdminAccess() {
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            return false;
        }
        
        const user = JSON.parse(userData);
        return user.role === 'Администратор';
    }
    
    // Загружаем список автомобилей
    async function loadCars() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/admin/cars', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка загрузки автомобилей');
            }
            
            if (!result.cars) {
                throw new Error('Некорректный формат ответа от сервера');
            }
            
            renderCarsTable(result.cars);
        } catch (error) {
            console.error('Ошибка:', error);
            carsTableContainer.innerHTML = `
                <div class="no-data">
                    <p>Ошибка загрузки автомобилей: ${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Повторить</button>
                </div>
            `;
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
            carsTableContainer.innerHTML = `
                <div class="no-data">
                    <p>Автомобили не найдены</p>
                </div>
            `;
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
            
            const priceFormatted = new Intl.NumberFormat('ru-RU').format(car.price) + ' ₽';
            const mileageFormatted = car.mileage ? new Intl.NumberFormat('ru-RU').format(car.mileage) + ' км' : '0 км';
            const statusText = car.status === 'new' ? 'Новый' : 'С пробегом';
            const statusClass = car.status === 'new' ? 'role-admin' : 'role-user';
            const imageUrl = car.image_url || 'https://via.placeholder.com/100x60?text=Авто';
            
            tableHTML += `
                <tr>
                    <td>${car.id || 'N/A'}</td>
                    <td>
                        <img src="${imageUrl}" 
                             alt="${car.brand} ${car.model}" 
                             style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px;"
                             onerror="this.src='https://via.placeholder.com/100x60?text=Авто'">
                    </td>
                    <td>
                        <strong>${car.brand || 'Не указана'}</strong><br>
                        ${car.model || 'Не указана'}
                    </td>
                    <td>${car.year || 'N/A'}</td>
                    <td><strong>${priceFormatted}</strong></td>
                    <td>${mileageFormatted}</td>
                    <td>
                        <span class="role-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="user-actions">
                            <button class="btn btn-warning btn-icon" onclick="editCar(${car.id || 0})">
                                Редактировать
                            </button>
                            <button class="btn btn-danger btn-icon" onclick="confirmDeleteCar(${car.id || 0}, '${(car.brand || '') + ' ' + (car.model || '')}')">
                                Удалить
                            </button>
                            <button class="btn btn-small" onclick="viewInCatalog(${car.id || 0})" style="margin-top: 5px;">
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
        document.getElementById('carYear').value = new Date().getFullYear();
        document.getElementById('carStatus').value = 'new';
        document.getElementById('carTransmission').value = 'Автомат';
        document.getElementById('carFuel').value = 'Бензин';
        document.getElementById('carBody').value = 'Седан';
        document.getElementById('carColor').value = 'Черный';
        
        carModal.style.display = 'flex';
    }
    
    // Открываем модальное окно для редактирования автомобиля
    window.editCar = async function(carId) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/cars/${carId}`);
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка загрузки данных автомобиля');
            }
            
            if (!result.car) {
                throw new Error('Некорректный формат данных автомобиля');
            }
            
            const car = result.car;
            currentCar = car;
            
            document.getElementById('carModalTitle').textContent = 'Редактировать автомобиль';
            document.getElementById('carId').value = car.id;
            document.getElementById('carBrand').value = car.brand || '';
            document.getElementById('carModel').value = car.model || '';
            document.getElementById('carYear').value = car.year || new Date().getFullYear();
            document.getElementById('carPrice').value = car.price || '';
            document.getElementById('carMileage').value = car.mileage || '';
            document.getElementById('carEngine').value = car.engineSize || '';
            document.getElementById('carHorsepower').value = car.horsepower || '';
            document.getElementById('carTransmission').value = car.transmission || 'Автомат';
            document.getElementById('carFuel').value = car.fuel || 'Бензин';
            document.getElementById('carBody').value = car.body || 'Седан';
            document.getElementById('carColor').value = car.color || '';
            document.getElementById('carStatus').value = car.status || 'new';
            document.getElementById('carImage').value = car.image_url || '';
            document.getElementById('carDescription').value = car.description || '';
            
            carModal.style.display = 'flex';
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка загрузки данных автомобиля: ' + error.message);
        }
    }
    
    // Подтверждение удаления автомобиля
    window.confirmDeleteCar = function(carId, carName) {
        carToDelete = carId;
        document.getElementById('deleteCarMessage').textContent = 
            `Вы действительно хотите удалить автомобиль "${carName}"? Это действие нельзя отменить.`;
        deleteCarModal.style.display = 'flex';
    }
    
    // Сохранение автомобиля
    async function saveCar() {
        const carData = {
            brand: document.getElementById('carBrand').value,
            model: document.getElementById('carModel').value,
            year: document.getElementById('carYear').value,
            price: document.getElementById('carPrice').value,
            mileage: document.getElementById('carMileage').value || 0,
            engineSize: document.getElementById('carEngine').value,
            horsepower: document.getElementById('carHorsepower').value,
            transmission: document.getElementById('carTransmission').value,
            fuel: document.getElementById('carFuel').value,
            body: document.getElementById('carBody').value,
            color: document.getElementById('carColor').value,
            status: document.getElementById('carStatus').value,
            image_url: document.getElementById('carImage').value,
            description: document.getElementById('carDescription').value
        };
        
        // Валидация
        if (!carData.brand || !carData.model || !carData.year || !carData.price) {
            alert('Пожалуйста, заполните обязательные поля (Марка, Модель, Год, Цена)');
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            let response;
            let url;
            let method;
            
            if (currentCar) {
                // Редактирование существующего автомобиля
                url = `/api/admin/cars/${currentCar.id}`;
                method = 'PUT';
            } else {
                // Добавление нового автомобиля
                url = '/api/admin/cars';
                method = 'POST';
            }
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carData)
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Ошибка сохранения автомобиля');
            }
            
            closeModal(carModal);
            loadCars();
            showSuccessMessage(
                currentCar ? 
                'Автомобиль успешно обновлен!' : 
                'Автомобиль успешно добавлен!'
            );
            
            currentCar = null;
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка сохранения автомобиля: ' + error.message);
        }
    }
    
    // Удаление автомобиля
    async function deleteCar() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/admin/cars/${carToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Ошибка удаления автомобиля');
            }
            
            closeModal(deleteCarModal);
            loadCars();
            showSuccessMessage('Автомобиль успешно удален!');
            carToDelete = null;
            
        } catch (error) {
            console.error('Ошибка:', error);
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
        // Отправка формы по Enter
        carForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveCarBtn.click();
            }
        });
    }
    
    initAdminPage();
});