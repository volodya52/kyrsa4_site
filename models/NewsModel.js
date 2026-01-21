class NewsModel {
    async getAllNews() {
        try {
            const response = await fetch('/api/news');
            const data = await response.json();
            return data.success ? data.news : [];
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    }

    async saveNews(newsData, newsId = null) {
        try {
            const token = localStorage.getItem('auth_token');
            const url = newsId ? `/api/admin/news/${newsId}` : '/api/admin/news';
            const method = newsId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newsData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving news:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async deleteNews(newsId) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/admin/news/${newsId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting news:', error);
            return { success: false, error: 'Network error' };
        }
    }
}