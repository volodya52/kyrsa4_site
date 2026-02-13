class UserController {
    constructor() {
        this.userModel = new UserModel();
        this.rolesCache = null;
    }

    async getUsers() {
        try {
            const token = this.userModel.getToken();
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data.success ? data.users : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    async getUserById(userId) {
        try {
            const token = this.userModel.getToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data.success ? data.user : null;
        } catch (error) {
            console.error('Error loading user:', error);
            return null;
        }
    }

    async saveUser(userData, userId = null) {
        try {
            const token = this.userModel.getToken();
            const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';
            const method = userId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving user:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async deleteUser(userId) {
        try {
            const token = this.userModel.getToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async getRoles() {
        // Если роли уже загружены, возвращаем из кэша
        if (this.rolesCache) {
            console.log('Возвращаем роли из кэша контроллера');
            return this.rolesCache;
        }

        try {
            const roles = await this.userModel.getRoles();
            this.rolesCache = roles; // Сохраняем в кэш
            return roles;
        } catch (error) {
            console.error('Ошибка загрузки ролей:', error);
            return [
                { id: 1, name: 'Администратор' },
                { id: 2, name: 'Клиент' }
            ];
        }
    }
}