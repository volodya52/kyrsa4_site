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
    

    confirmLoginBtn.addEventListener('click', function() {
        if (validateLoginForm()) {
            closeModal(loginModal);
            showSuccessMessage('Вы успешно вошли в систему!');
        }
    });
    
    confirmRegisterBtn.addEventListener('click', function() {
        if (validateRegisterForm()) {
            closeModal(registerModal);
            showSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
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
});