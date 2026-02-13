class NewsAdminView {
    constructor() {
        // Сохраняем элементы
        this.newsTableBody = document.getElementById('newsTableBody');
        this.loading = document.getElementById('loading');
        this.noNews = document.getElementById('noNews');
        this.accessDenied = document.getElementById('accessDenied');
        
        // Кнопки
        this.addNewsBtn = document.getElementById('addNewsBtn');
        
        // Модальные окна - сразу ищем в DOM
        this.newsFormModal = document.getElementById('newsFormModal');
        
        // Initialize Models and Controllers
        this.userModel = new UserModel();
        this.newsController = new NewsController();
        this.newsController.setView(this, true);
        
        this.news = [];
        this.currentNewsId = null;
        
        console.log('User model initialized:', this.userModel);
        
        this.init();
    }
    
    async init() {
        console.log('=== Starting initialization ===');
        
        // Сначала показываем загрузку
        this.showLoading();
        
        // Проверяем авторизацию через модель
        const authResult = await this.checkAuth();
        console.log('Auth result:', authResult);
        
        if (!authResult.isAuthenticated) {
            this.showAccessDenied('Требуется авторизация. Пожалуйста, войдите в систему.');
            return;
        }
        
        if (!authResult.isAdmin) {
            this.showAccessDenied('Недостаточно прав. Требуется роль администратора.');
            return;
        }
        
        console.log('=== User is admin, proceeding ===');
        
        // Настраиваем интерфейс
        this.setupUI();
        this.setupEventListeners();
        
        // Загружаем новости через контроллер
        await this.loadNews();
    }
    
    async checkAuth() {
        console.log('=== Checking authentication ===');
        
        // Используем UserModel для проверки авторизации
        const validation = await this.userModel.validateToken();
        
        if (!validation.isValid) {
            return { 
                isAuthenticated: false, 
                isAdmin: false, 
                error: 'Требуется авторизация' 
            };
        }
        
        const isAdmin = this.userModel.isAdmin();
        console.log('Is user admin?', isAdmin);
        
        return { 
            isAuthenticated: true, 
            isAdmin: isAdmin, 
            user: validation.user 
        };
    }
    
    setupUI() {
        console.log('Setting up UI...');
        
        // Показываем кнопку добавления
        if (this.addNewsBtn) {
            this.addNewsBtn.style.display = 'block';
        }
        
        // Скрываем сообщение о запрете доступа
        if (this.accessDenied) {
            this.accessDenied.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Кнопка добавления новости
        if (this.addNewsBtn) {
            // Удаляем старые обработчики
            this.addNewsBtn.removeEventListener('click', this.addNewsHandler);
            // Создаем новый обработчик
            this.addNewsHandler = () => {
                console.log('Add news button clicked');
                this.openNewsForm();
            };
            this.addNewsBtn.addEventListener('click', this.addNewsHandler);
        }
        
        // Кнопки в модальном окне (если модальное окно уже есть)
        if (this.newsFormModal) {
            this.setupModalEventListeners();
        }
    }
    
    setupModalEventListeners() {
        console.log('Setting up modal event listeners...');
        
        const saveBtn = document.getElementById('saveNewsBtn');
        const cancelBtn = document.getElementById('cancelNewsBtn');
        const closeBtn = document.getElementById('closeNewsFormModal');
        
        if (saveBtn) {
            // Удаляем старые обработчики
            saveBtn.removeEventListener('click', this.saveNewsHandler);
            // Создаем новый обработчик
            this.saveNewsHandler = () => {
                console.log('Save news button clicked');
                this.saveNews();
            };
            saveBtn.addEventListener('click', this.saveNewsHandler);
        }
        
        if (cancelBtn) {
            cancelBtn.removeEventListener('click', this.cancelNewsHandler);
            this.cancelNewsHandler = () => {
                console.log('Cancel button clicked');
                this.closeNewsForm();
            };
            cancelBtn.addEventListener('click', this.cancelNewsHandler);
        }
        
        if (closeBtn) {
            closeBtn.removeEventListener('click', this.closeNewsHandler);
            this.closeNewsHandler = () => {
                this.closeNewsForm();
            };
            closeBtn.addEventListener('click', this.closeNewsHandler);
        }
        
        // Закрытие при клике вне модального окна
        if (this.newsFormModal) {
            this.newsFormModal.removeEventListener('click', this.overlayClickHandler);
            this.overlayClickHandler = (e) => {
                if (e.target === this.newsFormModal) {
                    this.closeNewsForm();
                }
            };
            this.newsFormModal.addEventListener('click', this.overlayClickHandler);
        }

        // Настройка загрузки файла
        this.setupFileUpload();
    }

    // Настройка загрузки файлов
    setupFileUpload() {
        const fileInput = document.getElementById('newsImageFile');
        const previewImage = document.getElementById('newsPreviewImage');
        const noImageText = document.getElementById('newsNoImageText');
        const hiddenInput = document.getElementById('newsImageUrl');

        if (!fileInput) return;

        // Удаляем старый обработчик, если есть
        if (this.fileUploadHandler) {
            fileInput.removeEventListener('change', this.fileUploadHandler);
        }
        
        // Создаем новый обработчик
        this.fileUploadHandler = (event) => {
            const file = event.target.files[0];
            
            if (file) {
                // Проверка размера файла (максимум 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Файл слишком большой. Максимальный размер 5MB');
                    fileInput.value = '';
                    return;
                }

                // Проверка типа файла
                if (!file.type.startsWith('image/')) {
                    alert('Пожалуйста, выберите изображение');
                    fileInput.value = '';
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    // Показываем предпросмотр
                    if (previewImage) {
                        previewImage.src = e.target.result;
                        previewImage.style.display = 'block';
                    }
                    if (noImageText) noImageText.style.display = 'none';
                    
                    // Сохраняем base64 строку в скрытое поле
                    if (hiddenInput) hiddenInput.value = e.target.result;
                };
                
                reader.readAsDataURL(file);
            } else {
                // Очищаем предпросмотр
                this.resetFileUpload();
            }
        };

        fileInput.addEventListener('change', this.fileUploadHandler);
    }

    // Сброс загрузки файла
    resetFileUpload() {
        const fileInput = document.getElementById('newsImageFile');
        const previewImage = document.getElementById('newsPreviewImage');
        const noImageText = document.getElementById('newsNoImageText');
        const hiddenInput = document.getElementById('newsImageUrl');

        if (fileInput) fileInput.value = '';
        if (previewImage) {
            previewImage.style.display = 'none';
            previewImage.src = '#';
        }
        if (noImageText) noImageText.style.display = 'block';
        if (hiddenInput) hiddenInput.value = '';
    }

    // Загрузка существующего изображения в предпросмотр
    loadExistingImage(imageUrl) {
        const previewImage = document.getElementById('newsPreviewImage');
        const noImageText = document.getElementById('newsNoImageText');
        const hiddenInput = document.getElementById('newsImageUrl');

        if (imageUrl && previewImage) {
            previewImage.src = imageUrl;
            previewImage.style.display = 'block';
            if (noImageText) noImageText.style.display = 'none';
            if (hiddenInput) hiddenInput.value = imageUrl;
        } else {
            this.resetFileUpload();
        }
    }
    
    async loadNews() {
        console.log('=== Loading news ===');
        
        try {
            this.news = await this.newsController.loadNews();
            console.log(`Loaded ${this.news.length} news items`);
            this.renderNewsTable();
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError('Ошибка загрузки новостей. Попробуйте обновить страницу.');
        }
    }
    
    renderNewsTable() {
        console.log('Rendering news table...');
        
        if (!this.news || this.news.length === 0) {
            this.showNoNews();
            return;
        }
        
        this.hideLoading();
        this.hideNoNews();
        
        const rows = this.news.map(news => this.createNewsRow(news)).join('');
        this.newsTableBody.innerHTML = rows;
        
        // Добавляем обработчики для кнопок действий
        this.addTableEventListeners();
    }
    
    createNewsRow(news) {
        const typeLabels = {
            'news': 'Новость',
            'promotions': 'Акция',
            'reviews': 'Обзор',
            'events': 'Событие'
        };
        
        const typeClass = news.type === 'promotions' ? 'role-admin' : 'role-user';
        const typeLabel = typeLabels[news.type] || news.type;
        
        // Обрезаем заголовок для отображения
        const shortTitle = news.title && news.title.length > 40 
            ? news.title.substring(0, 40) + '...' 
            : news.title || 'Без заголовка';
        
        return `
            <tr>
                <td>${news.id || ''}</td>
                <td title="${news.title || ''}">
                    <strong>${shortTitle}</strong>
                </td>
                <td>
                    <span class="role-badge ${typeClass}">
                        ${typeLabel}
                    </span>
                </td>
                <td>${news.author_name || 'Администратор'}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-small edit-news-btn" 
                                data-id="${news.id}"
                                title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn btn-small btn-danger delete-news-btn" 
                                data-id="${news.id}"
                                title="Удалить">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    addTableEventListeners() {
        // Кнопки редактирования
        document.querySelectorAll('.edit-news-btn').forEach(btn => {
            btn.removeEventListener('click', this.editNewsHandler);
            this.editNewsHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newsId = btn.dataset.id;
                console.log('Edit button clicked for news:', newsId);
                this.editNews(newsId);
            };
            btn.addEventListener('click', this.editNewsHandler);
        });
        
        // Кнопки удаления
        document.querySelectorAll('.delete-news-btn').forEach(btn => {
            btn.removeEventListener('click', this.deleteNewsHandler);
            this.deleteNewsHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newsId = btn.dataset.id;
                console.log('Delete button clicked for news:', newsId);
                this.deleteNews(newsId);
            };
            btn.addEventListener('click', this.deleteNewsHandler);
        });
    }
    
    openNewsForm(newsId = null) {
        console.log('Opening news form for ID:', newsId);
        
        // Если модальное окно не существует в DOM, создаем его
        if (!this.newsFormModal) {
            this.newsFormModal = document.getElementById('newsFormModal');
        }
        
        if (!this.newsFormModal) {
            this.createNewsFormModal();
        } else {
            // Переинициализируем обработчики событий
            this.setupModalEventListeners();
        }
        
        this.currentNewsId = newsId;
        
        const modalTitle = document.getElementById('modalNewsFormTitle');
        if (modalTitle) {
            modalTitle.textContent = newsId ? 'Редактировать новость' : 'Добавить новость';
        }
        
        if (newsId) {
            // Редактирование
            this.fillNewsForm(newsId);
        } else {
            // Добавление
            this.clearNewsForm();
        }
        
        this.newsFormModal.style.display = 'flex';
    }
    
    createNewsFormModal() {
        console.log('Creating news form modal...');
        
        const modalHTML = `
            <div class="modal-overlay modal-user-form" id="newsFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modalNewsFormTitle">Добавить новость</h2>
                        <button class="modal-close" id="closeNewsFormModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="newsForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="newsTitle">Заголовок *</label>
                                    <input type="text" id="newsTitle" required>
                                </div>
                                <div class="form-group">
                                    <label for="newsType">Тип *</label>
                                    <select id="newsType" required>
                                        <option value="news">Новость</option>
                                        <option value="promotions">Акция</option>
                                        <option value="reviews">Обзор</option>
                                        <option value="events">Событие</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="newsDescription">Описание *</label>
                                <textarea id="newsDescription" rows="4" required></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="newsCarId">ID автомобиля (опционально)</label>
                                    <input type="number" id="newsCarId" min="0">
                                </div>
                                <div class="form-group file-upload-group">
                                    <label for="newsImageFile">Изображение новости</label>
                                    <div class="file-upload-container">
                                        <input type="file" id="newsImageFile" accept="image/*" class="file-input">
                                        <div class="file-upload-preview" id="newsImagePreview">
                                            <img id="newsPreviewImage" src="#" alt="Предпросмотр" style="display: none; max-width: 100%; max-height: 150px; border-radius: 4px;">
                                            <div id="newsNoImageText" class="no-image-text">Фото не выбрано</div>
                                        </div>
                                        <input type="hidden" id="newsImageUrl" name="newsImageUrl">
                                        <small class="form-text">Выберите изображение для новости (JPG, PNG, GIF, до 5MB)</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="carInfo" class="car-info-summary" style="display: none;">
                                <!-- Car info will be loaded here -->
                            </div>
                            
                            <input type="hidden" id="newsId">
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn" id="cancelNewsBtn">Отмена</button>
                        <button type="button" class="btn btn-primary" id="saveNewsBtn">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.newsFormModal = document.getElementById('newsFormModal');
        this.setupModalEventListeners();
    }
    
    fillNewsForm(newsId) {
        const news = this.news.find(n => n.id == newsId);
        if (!news) {
            console.error('News not found:', newsId);
            return;
        }
        
        const titleInput = document.getElementById('newsTitle');
        const typeSelect = document.getElementById('newsType');
        const descInput = document.getElementById('newsDescription');
        const carIdInput = document.getElementById('newsCarId');
        const newsIdInput = document.getElementById('newsId');
        
        if (newsIdInput) newsIdInput.value = news.id;
        if (titleInput) titleInput.value = news.title || '';
        if (typeSelect) typeSelect.value = news.type || 'news';
        if (descInput) descInput.value = news.description || '';
        if (carIdInput) carIdInput.value = news.car_id || '';
        
        // Загружаем изображение, если есть
        if (news.image_url) {
            this.loadExistingImage(news.image_url);
        } else {
            this.resetFileUpload();
        }
        
        if (news.car_id) {
            this.loadCarInfo(news.car_id);
        }
    }
    
    clearNewsForm() {
        const form = document.getElementById('newsForm');
        if (form) {
            form.reset();
        }
        
        const newsIdInput = document.getElementById('newsId');
        if (newsIdInput) newsIdInput.value = '';
        
        const carInfo = document.getElementById('carInfo');
        if (carInfo) carInfo.style.display = 'none';
        
        this.resetFileUpload();
    }
    
    async loadCarInfo(carId) {
        if (!carId) return;
        
        try {
            const carModel = new CarModel();
            const car = await carModel.getCarById(carId);
            
            if (car) {
                const carInfo = document.getElementById('carInfo');
                if (carInfo) {
                    carInfo.innerHTML = `
                        <div style="display: flex; gap: 15px; align-items: center; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                            <div class="car-info-image">
                                <img src="${car.image_url || 'https://via.placeholder.com/100x60?text=Авто'}" 
                                     alt="${car.brand} ${car.model}"
                                     style="width: 100px; height: auto; border-radius: 4px;">
                            </div>
                            <div class="car-info-details">
                                <h4 style="margin: 0 0 5px 0;">${car.brand} ${car.model}</h4>
                                <p style="margin: 0; color: #666;">${car.year} год</p>
                                <p style="margin: 5px 0 0 0; font-weight: bold; color: #007bff;">
                                    ${car.price ? car.price.toLocaleString('ru-RU') : '0'} ₽
                                </p>
                            </div>
                        </div>
                    `;
                    carInfo.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error loading car info:', error);
        }
    }
    
    closeNewsForm() {
        if (this.newsFormModal) {
            this.newsFormModal.style.display = 'none';
        }
        this.currentNewsId = null;
        this.clearNewsForm();
    }
    
    async saveNews() {
        console.log('Saving news...');
        
        const newsId = document.getElementById('newsId')?.value;
        const title = document.getElementById('newsTitle')?.value?.trim();
        const type = document.getElementById('newsType')?.value;
        const description = document.getElementById('newsDescription')?.value?.trim();
        const imageUrl = document.getElementById('newsImageUrl')?.value?.trim();
        const carId = document.getElementById('newsCarId')?.value || null;
        
        if (!title || !description) {
            alert('Заполните обязательные поля: заголовок и описание');
            return;
        }
        
        const newsData = {
            title,
            type,
            description,
            car_id: carId,
            image_url: imageUrl || null
        };
        
        console.log('Saving news data:', newsData);
        
        try {
            const result = await this.newsController.saveNews(newsData, newsId || null);
            console.log('Save result:', result);
            
            if (result.success) {
                this.closeNewsForm();
                await this.loadNews();
                this.showSuccessMessage(newsId ? 'Новость обновлена' : 'Новость добавлена');
            } else {
                alert(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving news:', error);
            alert('Ошибка соединения с сервером');
        }
    }
    
    async editNews(newsId) {
        this.openNewsForm(newsId);
    }
    
    async deleteNews(newsId) {
        if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
            return;
        }
        
        try {
            const result = await this.newsController.deleteNews(newsId);
            
            if (result.success) {
                await this.loadNews();
                this.showSuccessMessage('Новость удалена');
            } else {
                alert(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Ошибка соединения с сервером');
        }
    }
    
    showLoading() {
        if (this.loading) this.loading.style.display = 'block';
        if (this.noNews) this.noNews.style.display = 'none';
        if (this.accessDenied) this.accessDenied.style.display = 'none';
        if (this.newsTableBody) {
            this.newsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="spinner" style="margin: 0 auto 20px;"></div>
                        <p>Загрузка новостей...</p>
                    </td>
                </tr>
            `;
        }
    }
    
    hideLoading() {
        if (this.loading) this.loading.style.display = 'none';
    }
    
    showNoNews() {
        this.hideLoading();
        if (this.noNews) {
            this.noNews.style.display = 'block';
        }
        if (this.newsTableBody) {
            this.newsTableBody.innerHTML = '';
        }
    }
    
    hideNoNews() {
        if (this.noNews) this.noNews.style.display = 'none';
    }
    
    showAccessDenied(message) {
        console.log('Showing access denied:', message);
        
        this.hideLoading();
        this.hideNoNews();
        
        if (this.accessDenied) {
            this.accessDenied.style.display = 'block';
            const messageElement = this.accessDenied.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
        
        if (this.newsTableBody) {
            this.newsTableBody.innerHTML = '';
        }
        
        // Скрываем кнопку добавления
        if (this.addNewsBtn) {
            this.addNewsBtn.style.display = 'none';
        }
    }
    
    showError(message) {
        this.hideLoading();
        
        if (this.newsTableBody) {
            this.newsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #dc3545;">
                        ${message}
                    </td>
                </tr>
            `;
        }
    }
    
    showSuccessMessage(message) {
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            if (successMsg.parentNode) {
                successMsg.remove();
            }
        }, 3000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM loaded, initializing NewsAdminView ===');
    
    try {
        window.newsAdminView = new NewsAdminView();
        console.log('NewsAdminView initialized successfully');
    } catch (error) {
        console.error('Error initializing NewsAdminView:', error);
        
        // Показываем сообщение об ошибке
        const container = document.querySelector('.admin-container') || document.body;
        container.innerHTML = `
            <div class="access-denied" style="margin-top: 100px; text-align: center;">
                <h2 style="color: #dc3545;">Ошибка инициализации</h2>
                <p style="color: #666; margin-bottom: 30px;">${error.message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-primary" onclick="window.location.reload()">Обновить страницу</button>
                    <a href="news.html" class="btn btn-secondary">К новостям</a>
                </div>
            </div>
        `;
    }
});