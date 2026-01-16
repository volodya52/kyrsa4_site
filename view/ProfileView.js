document.addEventListener('DOMContentLoaded', function() {
    // Элементы страницы
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userNameDetail = document.getElementById('userNameDetail');
    const userEmailDetail = document.getElementById('userEmailDetail');
    const userPhoneDetail = document.getElementById('userPhoneDetail');
    const userRoleDetail = document.getElementById('userRoleDetail');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const avatarImage = document.getElementById('avatarImage');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    const logoutBtn = document.getElementById('logoutBtn');
    const favoritesContent = document.getElementById('favoritesContent');
    const favoritesCount = document.getElementById('favoritesCount');
    
    // Текущий пользователь
    let currentUser = null;
    
    // Инициализация страницы профиля
    async function initProfilePage() {
        // Проверяем авторизацию
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (!userData || !token) {
            // Если пользователь не авторизован, перенаправляем на главную
            window.location.href = 'index.html';
            return;
        }
        
        // Получаем данные пользователя
        currentUser = JSON.parse(userData);
        
        // Загружаем профиль пользователя с сервера
        await loadUserProfile();
        
        // Загружаем избранные автомобили
        await loadFavorites();
        
        // Назначаем обработчики событий
        setupEventListeners();
    }
    
    // Загрузка профиля пользователя с сервера
    async function loadUserProfile() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Неавторизован - перенаправляем на главную
                    window.logoutUser();
                    return;
                }
                throw new Error('Ошибка загрузки профиля');
            }
            
            const data = await response.json();
            
            if (data.success && data.user) {
                // Обновляем данные пользователя в localStorage
                localStorage.setItem('user_data', JSON.stringify(data.user));
                currentUser = data.user;
                updateUserProfile(data.user);
            }
            
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            showMessage('Ошибка загрузки профиля', 'error');
        }
    }
    
    // Обновление интерфейса профиля
    function updateUserProfile(user) {
        // Отображаем имя пользователя
        const displayName = user.name || 'Пользователь';
        userNameDisplay.textContent = displayName;
        userNameDetail.textContent = displayName;
        
        // Отображаем email
        userEmailDetail.textContent = user.email || 'Не указан';
        
        // Отображаем телефон
        userPhoneDetail.textContent = user.phone || 'Не указан';
        
        // Отображаем роль
        userRoleDetail.textContent = user.role || 'Клиент';
        
        // Отображаем аватар (если есть в localStorage)
        updateAvatar();
    }
    
    // Обновление аватара
    function updateAvatar() {
        if (!currentUser) return;
        
        // Проверяем, есть ли сохраненный аватар в localStorage
        const savedAvatar = localStorage.getItem(`avatar_${currentUser.id}`);
        
        if (savedAvatar) {
            // Показываем сохраненный аватар
            avatarImage.src = savedAvatar;
            avatarImage.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            // Показываем инициал имени
            const firstLetter = (currentUser.name || 'П').charAt(0).toUpperCase();
            avatarPlaceholder.textContent = firstLetter;
            avatarPlaceholder.style.display = 'flex';
            avatarImage.style.display = 'none';
        }
    }
    
    // Загрузка избранных автомобилей с сервера
    async function loadFavorites() {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/user/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 404) {
                // Если эндпоинт не существует, используем localStorage
                loadFavoritesFromLocalStorage();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                renderFavorites(data.favorites || []);
            } else {
                renderNoFavorites();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
            // Используем localStorage как fallback
            loadFavoritesFromLocalStorage();
        }
    }
    
    // Загрузка избранного из localStorage (fallback)
    function loadFavoritesFromLocalStorage() {
        if (!currentUser) return;
        
        const favoritesData = localStorage.getItem(`favorites_${currentUser.id}`);
        if (favoritesData) {
            const favoriteIds = JSON.parse(favoritesData);
            if (favoriteIds.length > 0) {
                // Получаем информацию об автомобилях по ID
                getCarsByIds(favoriteIds);
            } else {
                renderNoFavorites();
            }
        } else {
            renderNoFavorites();
        }
    }
    
    // Получение информации об автомобилях по ID
    async function getCarsByIds(carIds) {
        try {
            // Запрашиваем все автомобили
            const response = await fetch('/api/cars');
            
            if (!response.ok) {
                throw new Error('Ошибка загрузки автомобилей');
            }
            
            const data = await response.json();
            
            if (data.success && data.cars) {
                // Фильтруем автомобили по ID
                const favorites = data.cars.filter(car => 
                    carIds.includes(car.id)
                );
                
                renderFavorites(favorites);
            } else {
                renderNoFavorites();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки автомобилей:', error);
            renderNoFavorites();
        }
    }
    
    // Рендеринг списка избранных автомобилей
    function renderFavorites(favorites) {
        if (!favorites || favorites.length === 0) {
            renderNoFavorites();
            return;
        }
        
        // Обновляем счетчик
        favoritesCount.textContent = favorites.length;
        
        // Создаем сетку избранных автомобилей
        let favoritesHTML = `
            <div class="favorites-grid">
        `;
        
        favorites.forEach(car => {
            const priceFormatted = new Intl.NumberFormat('ru-RU').format(car.price) + ' ₽';
            const imageUrl = car.image_url || 'https://via.placeholder.com/300x150?text=Автомобиль';
            
            favoritesHTML += `
                <div class="favorite-card" data-car-id="${car.id}">
                    <img src="${imageUrl}" alt="${car.brand} ${car.model}" class="favorite-card-image" 
                         onerror="this.src='https://via.placeholder.com/300x150?text=Автомобиль'">
                    <div class="favorite-card-content">
                        <h3 class="favorite-card-title">${car.brand} ${car.model}</h3>
                        <p class="favorite-card-details">${car.year} год, ${car.transmission || 'Автомат'}</p>
                        <div class="favorite-card-price">${priceFormatted}</div>
                        <div class="favorite-card-actions">
                            <button class="btn btn-small" onclick="viewCarDetails(${car.id})">
                                Подробнее
                            </button>
                            <button class="btn btn-small btn-remove-favorite" 
                                    onclick="removeFromFavorites(${car.id}, '${car.brand} ${car.model}')">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        favoritesHTML += `
            </div>
        `;
        
        favoritesContent.innerHTML = favoritesHTML;
    }
    
    // Рендеринг сообщения об отсутствии избранных автомобилей
    function renderNoFavorites() {
        favoritesCount.textContent = '0';
        favoritesContent.innerHTML = `
            <div class="no-favorites">
                <div class="no-favorites-icon">❤️</div>
                <h3>Нет понравившихся автомобилей</h3>
                <p>Добавляйте автомобили в избранное, нажимая на сердечко в каталоге</p>
                <button class="btn btn-primary" onclick="location.href='cars.html'" style="margin-top: 20px;">
                    Перейти в каталог
                </button>
            </div>
        `;
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Кнопка загрузки аватара
        avatarUploadBtn.addEventListener('click', () => {
            avatarInput.click();
        });
        
        // Загрузка аватара
        avatarInput.addEventListener('change', handleAvatarUpload);
        
        // Кнопка выхода (используем глобальную функцию)
        logoutBtn.addEventListener('click', window.logoutUser);
    }
    
    // Обработка загрузки аватара
    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Проверяем тип файла
        if (!file.type.match('image.*')) {
            showMessage('Пожалуйста, выберите изображение', 'error');
            return;
        }
        
        // Проверяем размер файла (макс. 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMessage('Размер изображения не должен превышать 2MB', 'error');
            return;
        }
        
        // Читаем файл
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Пробуем сохранить аватар на сервер
                const success = await uploadAvatarToServer(file);
                
                if (success) {
                    // Сохраняем аватар в localStorage как fallback
                    localStorage.setItem(`avatar_${currentUser.id}`, e.target.result);
                    
                    // Обновляем отображение аватара
                    avatarImage.src = e.target.result;
                    avatarImage.style.display = 'block';
                    avatarPlaceholder.style.display = 'none';
                    
                    showMessage('Аватар успешно обновлен', 'success');
                } else {
                    showMessage('Ошибка загрузки аватара на сервер', 'error');
                }
            } catch (error) {
                console.error('Ошибка загрузки аватара:', error);
                showMessage('Ошибка загрузки аватара', 'error');
            }
        };
        
        reader.readAsDataURL(file);
        
        // Сбрасываем input
        avatarInput.value = '';
    }
    
    // Загрузка аватара на сервер
    async function uploadAvatarToServer(file) {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('/api/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            return response.ok;
        } catch (error) {
            console.error('Ошибка загрузки аватара на сервер:', error);
            return false;
        }
    }
    
    // Просмотр деталей автомобиля
    window.viewCarDetails = function(carId) {
        window.location.href = `car-details.html?id=${carId}`;
    };
    
    // Удаление из избранного
    window.removeFromFavorites = async function(carId, carName) {
        if (!confirm(`Удалить "${carName}" из избранного?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            
            // Пробуем удалить с сервера
            let removed = false;
            
            if (token) {
                const response = await fetch(`/api/user/favorites/${carId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                removed = response.ok;
            }
            
            // Если серверный метод не работает, удаляем из localStorage
            if (!removed && currentUser) {
                let favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.id}`)) || [];
                favorites = favorites.filter(id => id !== carId);
                localStorage.setItem(`favorites_${currentUser.id}`, JSON.stringify(favorites));
                removed = true;
            }
            
            if (removed) {
                showMessage(`"${carName}" удален из избранного`, 'success');
                // Обновляем список избранного
                setTimeout(() => {
                    loadFavorites();
                }, 500);
            } else {
                showMessage('Ошибка удаления из избранного', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка удаления из избранного:', error);
            showMessage('Ошибка удаления из избранного', 'error');
        }
    };
    
    // Показать сообщение
    function showMessage(text, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
        messageDiv.textContent = text;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
 
    initProfilePage();
});