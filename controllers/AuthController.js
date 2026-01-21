class AuthController {
    constructor() {
        this.userModel = new UserModel();
        this.signInView = null;
    }

    setView(view) {
        this.signInView = view;
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (data.success) {
                this.userModel.saveUserData(data.user, data.token);
                this.updateNavigation();
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async register(userData) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async logout() {
        const token = this.userModel.getToken();
        
        if (token) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        this.userModel.clearUserData();
        this.updateNavigation();
        return { success: true };
    }

    updateNavigation() {
        const user = this.userModel.getCurrentUser();
        const signinLinks = document.querySelectorAll('#signinLink, .nav-menu a[href="signin.html"]');
        
        if (user) {
            // User is logged in
            signinLinks.forEach(link => {
                link.textContent = user.name || 'Профиль';
                link.href = 'profile.html';
            });
            
            // Show/hide admin navigation
            if (this.userModel.isAdmin()) {
                this.showAdminNavigation();
            } else {
                this.hideAdminNavigation();
            }
        } else {
            // User is not logged in
            signinLinks.forEach(link => {
                link.textContent = 'Войти';
                link.href = '#';
            });
            this.hideAdminNavigation();
        }
    }

    showAdminNavigation() {
        // Show admin tabs
        ['carsTabItem', 'usersTabItem', 'newsTabItem'].forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'block';
        });

        // Add Users link to navigation
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.querySelector('.nav-menu a[href="users.html"]')) {
            const usersItem = document.createElement('li');
            usersItem.innerHTML = '<a href="users.html">Пользователи</a>';
            
            const signinItem = document.querySelector('#signinLink')?.closest('li');
            if (signinItem && signinItem.parentNode) {
                signinItem.parentNode.insertBefore(usersItem, signinItem);
            }
        }
    }

    hideAdminNavigation() {
        // Hide admin tabs
        ['carsTabItem', 'usersTabItem', 'newsTabItem'].forEach(tabId => {
            const tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'none';
        });

        // Remove Users link from navigation
        const usersLink = document.querySelector('.nav-menu a[href="users.html"]');
        if (usersLink && usersLink.closest('li')) {
            usersLink.closest('li').remove();
        }
    }

    checkAuthOnPageLoad() {
        const user = this.userModel.getCurrentUser();
        if (user) {
            this.updateNavigation();
        }
    }
}