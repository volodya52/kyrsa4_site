class UserModel {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userDataKey = 'user_data';
    }

    getCurrentUser() {
        const userData = localStorage.getItem(this.userDataKey);
        return userData ? JSON.parse(userData) : null;
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    saveUserData(user, token) {
        localStorage.setItem(this.userDataKey, JSON.stringify(user));
        localStorage.setItem(this.tokenKey, token);
    }

    clearUserData() {
        localStorage.removeItem(this.userDataKey);
        localStorage.removeItem(this.tokenKey);
    }

    isAdmin() {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        const roleName = (user.role || user.Role_Name || '').toLowerCase();
        const roleId = user.role_id || user.Role_ID;
        
        return roleName.includes('админ') || 
               roleName.includes('admin') ||
               roleName === 'администратор' ||
               roleName === 'administrator' ||
               roleId === 1;
    }

    async validateToken() {
        const token = this.getToken();
        if (!token) return { isValid: false };

        try {
            const response = await fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    this.saveUserData(data.user, token);
                    return { isValid: true, user: data.user };
                }
            }
            
            this.clearUserData();
            return { isValid: false };
        } catch (error) {
            console.error('Token validation error:', error);
            return { isValid: false };
        }
    }
}