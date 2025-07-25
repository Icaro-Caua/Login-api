// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    const registerMessageDiv = document.getElementById('registerMessage');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    const apiBaseUrl = 'http://localhost:3000/api/auth';

    function showMessage(div, msg, type) {
        div.textContent = msg;
        div.className = `message ${type}`;
        div.style.display = 'block';
    }

    registerForm.style.display = 'none';
    showRegisterLink.style.display = 'block';
    showLoginLink.style.display = 'none';

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        showRegisterLink.style.display = 'none';
        showLoginLink.style.display = 'block';
        messageDiv.style.display = 'none';
        registerMessageDiv.style.display = 'none';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showRegisterLink.style.display = 'block';
        showLoginLink.style.display = 'none';
        messageDiv.style.display = 'none';
        registerMessageDiv.style.display = 'none';
    });


    // Event listener para o formulário de LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch(`${apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // MENSAGEM DA API JÁ ESTARÁ TRADUZIDA
                showMessage(messageDiv, data.message, 'success');
                console.log('Token JWT:', data.token);
                localStorage.setItem('jwt_token', data.token);
            } else {
                // MENSAGEM PADRÃO DE ERRO DO CLIENTE, SE A API NÃO ENVIAR UMA
                showMessage(messageDiv, data.message || 'Erro ao fazer login.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            // MENSAGEM TRADUZIDA
            showMessage(messageDiv, 'Erro de conexão com o servidor.', 'error');
        }
    });

    // Event listener para o formulário de REGISTRO
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = registerForm.regUsername.value;
        const password = registerForm.regPassword.value;

        try {
            const response = await fetch(`${apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // MENSAGEM DA API JÁ ESTARÁ TRADUZIDA + CONCATENAÇÃO TRADUZIDA
                showMessage(registerMessageDiv, data.message + ' Agora faça login.', 'success');
                registerForm.reset();
                setTimeout(() => {
                    showLoginLink.click();
                }, 2000);
            } else {
                // MENSAGEM PADRÃO DE ERRO DO CLIENTE, SE A API NÃO ENVIAR UMA
                showMessage(registerMessageDiv, data.message || 'Erro ao registrar.', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ou servidor:', error);
            // MENSAGEM TRADUZIDA
            showMessage(registerMessageDiv, 'Erro de conexão com o servidor.', 'error');
        }
    });
});