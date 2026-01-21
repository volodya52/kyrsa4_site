// views/NewsAdminView.js - UPDATED FOR MVC
class NewsAdminView {
    constructor() {
        console.log('=== NewsAdminView initializing ===');
        
        // Сохраняем элементы
        this.newsTableBody = document.getElementById('newsTableBody');
        this.loading = document.getElementById('loading');
        this.noNews = document.getElementById('noNews');
        this.accessDenied = document.getElementById('accessDenied');
        
        // Кнопки
        this.addNewsBtn = document.getElementById('addNewsBtn');
        
        // Модальные окна
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
            this.addNewsBtn.addEventListener('click', () => {
                console.log('Add news button clicked');
                this.openNewsForm();
            });
        }
        
        // Кнопки в модальном окне (если они есть)
        this.setupModalEventListeners();
    }
    
    setupModalEventListeners() {
        const saveBtn = document.getElementById('saveNewsBtn');
        const cancelBtn = document.getElementById('cancelNewsBtn');
        const closeBtn = document.getElementById('closeNewsFormModal');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('Save news button clicked');
                this.saveNews();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                this.closeNewsForm();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeNewsForm();
            });
        }
        
        // Закрытие при клике вне модального окна
        if (this.newsFormModal) {
            this.newsFormModal.addEventListener('click', (e) => {
                if (e.target === this.newsFormModal) {
                    this.closeNewsForm();
                }
            });
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
        
        const carInfo = news.car_brand && news.car_model 
            ? `${news.car_brand} ${news.car_model}`
            : '—';
        
        // Обрезаем заголовок для отображения
        const shortTitle = news.title.length > 40 
            ? news.title.substring(0, 40) + '...' 
            : news.title;
        
        return `
            <tr>
                <td>${news.id}</td>
                <td title="${news.title}">
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
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newsId = btn.dataset.id;
                console.log('Edit button clicked for news:', newsId);
                this.editNews(newsId);
            });
        });
        
        // Кнопки удаления
        document.querySelectorAll('.delete-news-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newsId = btn.dataset.id;
                console.log('Delete button clicked for news:', newsId);
                this.deleteNews(newsId);
            });
        });
    }
    
    openNewsForm(newsId = null) {
        console.log('Opening news form for ID:', newsId);
        
        // Создаем модальное окно если его нет
        if (!this.newsFormModal || this.newsFormModal.style.display === 'none') {
            this.createNewsFormModal();
        }
        
        this.currentNewsId = newsId;
        
        if (newsId) {
            // Редактирование
            document.getElementById('modalNewsFormTitle').textContent = 'Редактировать новость';
            this.fillNewsForm(newsId);
        } else {
            // Добавление
            document.getElementById('modalNewsFormTitle').textContent = 'Добавить новость';
            this.clearNewsForm();
        }
        
        this.newsFormModal.style.display = 'flex';
    }
    
    createNewsFormModal() {
        // Если модальное окно уже есть в HTML, не создаем заново
        if (document.getElementById('newsFormModal')) {
            return;
        }
        
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
                                <div class="form-group">
                                    <label for="newsImageUrl">URL изображения</label>
                                    <input type="text" id="newsImageUrl">
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
        
        document.getElementById('newsId').value = news.id;
        document.getElementById('newsTitle').value = news.title;
        document.getElementById('newsType').value = news.type;
        document.getElementById('newsDescription').value = news.description;
        document.getElementById('newsImageUrl').value = news.image_url || '';
        document.getElementById('newsCarId').value = news.car_id || '';
        
        if (news.car_id) {
            this.loadCarInfo(news.car_id);
        }
    }
    
    clearNewsForm() {
        const form = document.getElementById('newsForm');
        if (form) {
            form.reset();
        }
        document.getElementById('newsId').value = '';
        document.getElementById('carInfo').style.display = 'none';
    }
    
    async loadCarInfo(carId) {
        if (!carId) return;
        
        try {
            // Используем CarModel через новый контроллер
            const carModel = new CarModel();
            const car = await carModel.getCarById(carId);
            
            if (car) {
                const carInfo = document.getElementById('carInfo');
                carInfo.innerHTML = `
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
                `;
                carInfo.style.display = 'flex';
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
        const newsId = document.getElementById('newsId').value;
        const title = document.getElementById('newsTitle').value.trim();
        const type = document.getElementById('newsType').value;
        const description = document.getElementById('newsDescription').value.trim();
        const imageUrl = document.getElementById('newsImageUrl').value.trim();
        const carId = document.getElementById('newsCarId').value || null;
        
        if (!title || !description) {
            alert('Заполните обязательные поля: заголовок и описание');
            return;
        }
        
        const newsData = {
            title,
            type,
            description,
            car_id: carId,
            image_url: imageUrl
        };
        
        console.log('Saving news data:', newsData);
        
        try {
            const result = await this.newsController.saveNews(newsData, newsId || null);
            
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
                        <p>Проверка прав доступа...</p>
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
            // Обновляем текст сообщения
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
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
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
            <div class="access-denied" style="margin-top: 100px;">
                <h2 style="color: #dc3545;">Ошибка инициализации</h2>
                <p>${error.message}</p>
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="window.location.reload()">Обновить страницу</button>
                    <a href="news.html" class="btn" style="margin-left: 10px;">К новостям</a>
                </div>
            </div>
        `;
    }
});