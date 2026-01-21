class FavoriteModel {
    constructor() {
        this.userModel = new UserModel();
    }

    async getUserFavorites() {
        const token = this.userModel.getToken();
        if (!token) return [];

        try {
            const response = await fetch('/api/user/favorites', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success ? data.favorites : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    async addFavorite(carId) {
        const token = this.userModel.getToken();
        if (!token) return { success: false, error: 'Not authorized' };

        try {
            const response = await fetch('/api/user/favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ carId })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding favorite:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async removeFavorite(carId) {
        const token = this.userModel.getToken();
        if (!token) return { success: false, error: 'Not authorized' };

        try {
            const response = await fetch(`/api/user/favorites/${carId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async checkIfFavorite(carId) {
        const token = this.userModel.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`/api/user/favorites/check/${carId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success && data.isFavorite;
            }
            return false;
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }
}