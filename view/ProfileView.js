// ProfileView.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
        console.log('=== НАЧАЛО initProfilePage ===');
        
        // Проверяем авторизацию
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        console.log('Данные из localStorage:', {
            userData: userData,
            token: token,
            hasUserData: !!userData,
            hasToken: !!token
        });
        
        if (!userData || !token) {
            // Если пользователь не авторизован, перенаправляем на главную
            console.log('❌ Пользователь не авторизован, перенаправляю на главную');
            console.log('userData отсутствует:', !userData);
            console.log('token отсутствует:', !token);
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Есть данные для инициализации профиля');
        
        try {
            // Парсим данные пользователя
            currentUser = JSON.parse(userData);
            console.log('Текущий пользователь из localStorage:', currentUser);
            
            // Сразу обновляем интерфейс данными из localStorage
            updateUserProfile(currentUser);
            
            console.log('✅ Интерфейс обновлен данными из localStorage');
            
            // Пробуем загрузить свежие данные с сервера (но не блокируем интерфейс)
            loadUserProfile().catch(error => {
                console.error('Ошибка загрузки профиля с сервера:', error);
                // Не перенаправляем пользователя, используем данные из localStorage
            });
            
            // Загружаем избранные автомобили
            loadFavorites().catch(error => {
                console.error('Ошибка загрузки избранного:', error);
            });
            
            // Назначаем обработчики событий
            setupEventListeners();
            
            console.log('✅ Профиль успешно инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации профиля:', error);
            // Не перенаправляем сразу, покажем данные из localStorage
            if (currentUser) {
                updateUserProfile(currentUser);
            } else {
                // Только если совсем не можем получить данные
                window.location.href = 'index.html';
            }
        }
        
        console.log('=== КОНЕЦ initProfilePage ===');
    }
    
    // Загрузка профиля пользователя с сервера
    async function loadUserProfile() {
        try {
            const token = localStorage.getItem('auth_token');
            
            console.log('Загружаю профиль с сервера, токен:', token ? 'есть' : 'нет');
            
            if (!token) {
                console.log('Токен отсутствует, пропускаю загрузку с сервера');
                return;
            }
            
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Ответ сервера на /api/user:', {
                status: response.status,
                ok: response.ok
            });
            
            // Если получили 401, не перенаправляем, просто не обновляем данные
            if (response.status === 401) {
                console.warn('Токен недействителен, но продолжаем использовать данные из localStorage');
                return;
            }
            
            if (!response.ok) {
                console.warn('Ошибка сервера, но продолжаем использовать данные из localStorage');
                return;
            }
            
            const data = await response.json();
            console.log('Данные профиля с сервера:', data);
            
            if (data.success && data.user) {
                // Обновляем данные пользователя в localStorage
                localStorage.setItem('user_data', JSON.stringify(data.user));
                currentUser = data.user;
                updateUserProfile(data.user);
                console.log('✅ Профиль обновлен данными с сервера');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки профиля с сервера:', error);
            // Не показываем сообщение об ошибке пользователю
            // Просто продолжаем использовать данные из localStorage
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
        if (userRoleDetail) {
            userRoleDetail.textContent = user.role || 'Клиент';
        }
        
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
            if (!token) {
                renderNoFavorites();
                return;
            }
            
            console.log('Загрузка избранных автомобилей...');
            
            const response = await fetch('/api/user/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Ответ сервера на /api/user/favorites:', {
                status: response.status,
                ok: response.ok
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Данные избранного с сервера:', data);
            
            if (data.success) {
                renderFavorites(data.favorites || []);
            } else {
                renderNoFavorites();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
            renderNoFavorites();
        }
    }
    
    // Рендеринг списка избранных автомобилей (ЕДИНСТВЕННАЯ ФУНКЦИЯ)
    function renderFavorites(favorites) {
        console.log('renderFavorites вызвана с:', favorites);
        
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
            const imageUrl = car.image_url || 'https://via.placeholder.com/300x200?text=Автомобиль';
            const mileageFormatted = car.mileage === 0 ? 'Новый' : `${car.mileage.toLocaleString('ru-RU')} км`;
            
            favoritesHTML += `
                <div class="favorite-card" data-car-id="${car.id}">
                    <div class="favorite-card-image-container">
                        <img src="${imageUrl}" alt="${car.brand} ${car.model}" 
                             class="favorite-card-image" 
                             onerror="this.src='https://via.placeholder.com/300x200?text=Автомобиль'">
                    </div>
                    <div class="favorite-card-content">
                        <h3 class="favorite-card-title">${car.brand} ${car.model}</h3>
                        <p class="favorite-card-details">
                            ${car.year} год · ${mileageFormatted}
                            ${car.transmission ? ` · ${car.transmission}` : ''}
                        </p>
                        <div class="favorite-card-price">${priceFormatted}</div>
                        <div class="favorite-card-actions">
                            <button class="btn btn-small btn-view" 
                                    onclick="window.location.href='car-details.html?id=${car.id}'">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Подробнее
                            </button>
                            <button class="btn btn-small btn-remove-favorite" 
                                    onclick="removeFromFavorites(${car.id}, '${car.brand} ${car.model}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                                Убрать
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
        console.log('Нет избранных автомобилей');
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
        if (avatarUploadBtn) {
            avatarUploadBtn.addEventListener('click', () => {
                if (avatarInput) avatarInput.click();
            });
        }
        
        // Загрузка аватара
        if (avatarInput) {
            avatarInput.addEventListener('change', handleAvatarUpload);
        }
        
        // Кнопка выхода (используем глобальную функцию)
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.logoutUser) {
                    window.logoutUser();
                }
            });
        }
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
    
    // Удаление из избранного
    window.removeFromFavorites = async function(carId, carName) {
        if (!confirm(`Удалить "${carName}" из избранного?`)) {
            return;
        }
        
        try {
            const token = localStorage.getItem('auth_token');
            
            // Удаляем с сервера
            if (token) {
                const response = await fetch(`/api/user/favorites/${carId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage(`"${carName}" удален из избранного`, 'success');
                    // Обновляем список избранного
                    setTimeout(() => {
                        loadFavorites();
                    }, 500);
                } else {
                    showMessage('Ошибка удаления из избранного', 'error');
                }
            } else {
                showMessage('Ошибка: пользователь не авторизован', 'error');
            }
            
        } catch (error) {
            console.error('Ошибка удаления из избранного:', error);
            showMessage('Ошибка удаления из избранного', 'error');
        }
    };
    
    // Показать сообщение
    function showMessage(text, type = 'success') {
        // Проверяем, есть ли уже уведомление
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${text}</span>
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
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
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
    
    // Инициализация
    initProfilePage();
});