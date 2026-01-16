document.addEventListener('DOMContentLoaded', function() {

    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const signinLinks = document.querySelectorAll('#signinLink, .nav-menu a[href="signin.html"]');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelLoginBtn = document.getElementById('cancelLoginBtn');
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    const showRegisterModalLink = document.getElementById('showRegisterModalLink');
    const showLoginModalLink = document.getElementById('showLoginModalLink');
    const confirmLoginBtn = document.getElementById('confirmLoginBtn');
    const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    signinLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(loginModal);
        });
    });

    closeLoginModal.addEventListener('click', () => closeModal(loginModal));
    closeRegisterModal.addEventListener('click', () => closeModal(registerModal));
    cancelLoginBtn.addEventListener('click', () => closeModal(loginModal));
    cancelRegisterBtn.addEventListener('click', () => closeModal(registerModal));
    
    [loginModal, registerModal].forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    showRegisterModalLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(loginModal);
        openModal(registerModal);
    });
    
    showLoginModalLink.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });

    function validateLoginForm() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        let isValid = true;
    
        document.getElementById('loginEmailError').textContent = '';
        document.getElementById('loginPasswordError').textContent = '';
        
        if (!email) {
            document.getElementById('loginEmailError').textContent = 'Введите email';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('loginEmailError').textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('loginPasswordError').textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('loginPasswordError').textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }
        
        return isValid;
    }
    
    function validateRegisterForm() {
        const name = document.getElementById('regName').value;
        const phone=document.getElementById('regPhone').value
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        let isValid = true;
        document.getElementById('regNameError').textContent = '';
        document.getElementById('regPhoneError').textContent='';
        document.getElementById('regEmailError').textContent = '';
        document.getElementById('regPasswordError').textContent = '';
        document.getElementById('regConfirmPasswordError').textContent = '';

        if (!name) {
            document.getElementById('regNameError').textContent = 'Введите имя';
            isValid = false;
        }
        
        if (!email) {
            document.getElementById('regEmailError').textContent = 'Введите email';
            isValid = false;
        } else if (!validateEmail(email)) {
            document.getElementById('regEmailError').textContent = 'Введите корректный email';
            isValid = false;
        }
        
        if (!password) {
            document.getElementById('regPasswordError').textContent = 'Введите пароль';
            isValid = false;
        } else if (password.length < 6) {
            document.getElementById('regPasswordError').textContent = 'Пароль должен содержать минимум 6 символов';
            isValid = false;
        }

        if (!confirmPassword) {
            document.getElementById('regConfirmPasswordError').textContent = 'Подтвердите пароль';
            isValid = false;
        } else if (password !== confirmPassword) {
            document.getElementById('regConfirmPasswordError').textContent = 'Пароли не совпадают';
            isValid = false;
        }

        if(!phone){
            document.getElementById('regPhoneError').textContent='Введите номер телефона';
            isValid=false;
        }else if(phone.length<11||phone.length>11){
            document.getElementById('regPhoneError').textContent='Длина номера должна быть не менее 11 и не более 12 цифр';
            isValid=false;
        }
        
        return isValid;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showSuccessMessage(message) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = message;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    

    confirmLoginBtn.addEventListener('click', async function() {
    if (validateLoginForm()) {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = await loginUser(email, password);
        
        if (result.success) {
            closeModal(loginModal);
            showSuccessMessage('Вы успешно вошли в систему!');
            updateUIAfterLogin(result.data.user);
        } else {
            document.getElementById('loginPasswordError').textContent = result.error;
        }
    }
});
    
    confirmRegisterBtn.addEventListener('click', async function() {
    if (validateRegisterForm()) {
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        const result = await registerUser(name, phone, email, password);
        
        if (result.success) {
            closeModal(registerModal);
            showSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
            await loginUser(email, password);
        } else {
            document.getElementById('regEmailError').textContent = result.error;
        }
    }
});
    
    document.getElementById('loginEmail').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmLoginBtn.click();
        }
    });
    
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmLoginBtn.click();
        }
    });
    
    document.getElementById('regConfirmPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmRegisterBtn.click();
        }
    });

    async function loginUser(email, password) {
        return fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
            // Сохраняем в localStorage
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                return data;
            } else {
                throw new Error(data.error);
            }
        });
    }

    async function registerUser(name, phone, email, password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, email, password })
            });
        
            const data = await response.json();
        
            if (data.success) {
                return { success: true, data };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }

    function checkAuth() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
    
        if (token && userData) {
            const user = JSON.parse(userData);
            updateUIForLoggedInUser(user);
        
        // Проверяем валидность токена на сервере
            fetch('/api/user', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (!response.ok) {
                // Токен невалидный, удаляем из localStorage
                    logoutUser();
                }
            })
            .catch(() => logoutUser());
        }
    }

    function updateUIForLoggedInUser(user) {
        const signinLink = document.getElementById('signinLink');
        if (signinLink) {
            const navItem = signinLink.closest('li');
            const navMenu = navItem.closest('.nav-menu');
            signinLink.textContent = user.name;
            signinLink.href = '#';
            signinLink.onclick = showUserMenu;
        
            let logoutLink = document.getElementById('logoutLink');
            if (!logoutLink) {
                const logoutItem = document.createElement('li');
                logoutItem.innerHTML = `<a href="#" id="logoutLink">Выйти</a>`;
                navItem.parentNode.insertBefore(logoutItem, navItem.nextSibling);
                logoutLink = document.getElementById('logoutLink');
                logoutLink.addEventListener('click', logoutUser);
            }
        }
    }

    function logoutUser() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetch('/api/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(console.error);
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        location.reload();
    }

    function updateUIAfterLogin(user) {
        updateUIForLoggedInUser(user);
    }


    checkAuth();
});