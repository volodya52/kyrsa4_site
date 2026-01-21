class NewsController {
    constructor() {
        this.newsModel = new NewsModel();
        this.newsView = null;
        this.newsAdminView = null;
    }

    setView(view, isAdmin = false) {
        if (isAdmin) {
            this.newsAdminView = view;
        } else {
            this.newsView = view;
        }
    }

    async loadNews() {
        return await this.newsModel.getAllNews();
    }

    async saveNews(newsData, newsId = null) {
        return await this.newsModel.saveNews(newsData, newsId);
    }

    async deleteNews(newsId) {
        return await this.newsModel.deleteNews(newsId);
    }

    filterNewsByType(news, type) {
        if (type === 'all') return news;
        return news.filter(item => item.type === type);
    }
}