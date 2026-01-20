class NewsView {
    constructor() {
        this.newsGrid = document.getElementById('newsGrid');
        this.loading = document.getElementById('loading');
        this.noNews = document.getElementById('noNews');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.newsDetailModal = document.getElementById('newsDetailModal');
        this.modalNewsTitle = document.getElementById('modalNewsTitle');
        this.modalNewsBody = document.getElementById('modalNewsBody');
        this.closeNewsModal = document.getElementById('closeNewsModal');
        
        this.currentFilter = 'all';
        this.news = [];
        
        this.init();
    }
    
    init() {
        this.loadNews();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.type;
                this.renderNews();
            });
        });
        
        // Modal close
        this.closeNewsModal.addEventListener('click', () => {
            this.newsDetailModal.style.display = 'none';
        });
        
        // Close modal on outside click
        this.newsDetailModal.addEventListener('click', (e) => {
            if (e.target === this.newsDetailModal) {
                this.newsDetailModal.style.display = 'none';
            }
        });
    }
    
    async loadNews() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            
            if (data.success) {
                this.news = data.news;
                this.renderNews();
            } else {
                this.showError('Не удалось загрузить новости');
            }
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            this.showError('Ошибка при загрузке новостей');
        }
    }
    
    renderNews() {
        const filteredNews = this.filterNews();
        
        if (filteredNews.length === 0) {
            this.showNoNews();
            return;
        }
        
        this.hideLoading();
        this.hideNoNews();
        
        this.newsGrid.innerHTML = filteredNews.map(news => this.createNewsCard(news)).join('');
        
        // Add click listeners to news cards
        document.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', () => this.showNewsDetail(card.dataset.id));
        });
    }
    
    filterNews() {
        if (this.currentFilter === 'all') {
            return this.news;
        }
        
        return this.news.filter(item => item.type === this.currentFilter);
    }
    
    createNewsCard(news) {
        const typeLabels = {
            'news': 'Новость',
            'promotions': 'Акция',
            'reviews': 'Обзор',
            'events': 'Событие'
        };
        
        const typeClass = `news-type-${news.type}`;
        const typeLabel = typeLabels[news.type] || news.type;
        
        const carInfo = news.car_brand && news.car_model 
            ? `<div class="news-car-info">${news.car_brand} ${news.car_model}</div>`
            : '';
        
        const imageUrl = news.image_url || 'https://via.placeholder.com/400x250?text=Новость';
        const maxLength = 150;
        const description = news.description.length > maxLength 
            ? news.description.substring(0, maxLength) + '...' 
            : news.description;
        
        return `
            <div class="news-card" data-id="${news.id}">
                <div class="news-image">
                    <img src="${imageUrl}" alt="${news.title}" loading="lazy">
                    <span class="news-badge ${typeClass}">${typeLabel}</span>
                </div>
                <div class="news-content">
                    <h3 class="news-title">${news.title}</h3>
                    ${carInfo}
                    <p class="news-description">${description}</p>
                    <div class="news-footer">
                        <div class="news-author">${news.author_name || 'Администратор'}</div>
                        <button class="btn btn-small">Читать далее</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    async showNewsDetail(newsId) {
        try {
            const news = this.news.find(n => n.id == newsId);
            if (!news) return;
            
            this.modalNewsTitle.textContent = news.title;
            
            const typeLabels = {
                'news': 'Новость',
                'promotions': 'Акция',
                'reviews': 'Обзор',
                'events': 'Событие'
            };
            
            const typeLabel = typeLabels[news.type] || news.type;
            const carInfo = news.car_brand && news.car_model 
                ? `<p><strong>Автомобиль:</strong> ${news.car_brand} ${news.car_model}</p>`
                : '';
            
            const authorInfo = news.author_name 
                ? `<p><strong>Автор:</strong> ${news.author_name}</p>`
                : '';
            
            const imageUrl = news.image_url 
                ? `<div class="news-detail-image">
                     <img src="${news.image_url}" alt="${news.title}">
                   </div>`
                : '';
            
            this.modalNewsBody.innerHTML = `
                ${imageUrl}
                <div class="news-meta">
                    <span class="news-type">${typeLabel}</span>
                    ${authorInfo}
                </div>
                ${carInfo}
                <div class="news-full-description">
                    ${news.description}
                </div>
            `;
            
            this.newsDetailModal.style.display = 'flex';
        } catch (error) {
            console.error('Ошибка отображения новости:', error);
        }
    }
    
    showLoading() {
        this.loading.style.display = 'block';
        this.noNews.style.display = 'none';
        this.newsGrid.innerHTML = '';
    }
    
    hideLoading() {
        this.loading.style.display = 'none';
    }
    
    showNoNews() {
        this.hideLoading();
        this.noNews.style.display = 'block';
        this.newsGrid.innerHTML = '';
    }
    
    hideNoNews() {
        this.noNews.style.display = 'none';
    }
    
    showError(message) {
        this.hideLoading();
        this.newsGrid.innerHTML = `
            <div class="search-error">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button class="btn" onclick="location.reload()">Попробовать снова</button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsGrid')) {
        new NewsView();
    }
});