// tests/integration/login.test.js

import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/app.js'; // Importa a aplicação Express
import pool from '../../src/config/db.js'; // Para limpar o banco de dados antes dos testes

describe('Auth API Integration Tests', () => {
    let server; // Variável para armazenar a instância do servidor

    // Antes de todos os testes, inicie o servidor
    before((done) => {
        // 'app' é a sua aplicação express, mas 'supertest' precisa de um servidor HTTP real
        // Então, iniciamos o servidor e guardamos a referência
        server = app.listen(0, () => { // Porta 0 permite que o SO escolha uma porta livre
            console.log('Test server started.');
            done();
        });
    });

    // Depois de todos os testes, feche o servidor
    after((done) => {
        server.close(() => {
            console.log('Test server closed.');
            done();
        });
    });

    // Antes de cada teste individual, limpe a tabela de usuários
    beforeEach(async () => {
        try {
            await pool.execute('DELETE FROM users'); // Limpa todos os usuários
            // Resetar auto_increment para garantir IDs consistentes nos testes
            await pool.execute('ALTER TABLE users AUTO_INCREMENT = 1');
            console.log('Tabela de usuários limpa antes do teste.');
        } catch (error) {
            console.error('Erro ao limpar a tabela de usuários:', error);
            // Se o erro for que a tabela não existe, criamos ela (caso algo falhe no createTable inicial)
            // Mas, idealmente, User.createTable() já deveria ter rodado no início da aplicação.
            // Para testes, é bom ter certeza que a estrutura está lá.
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    login_attempts INT DEFAULT 0,
                    last_attempt DATETIME,
                    is_locked BOOLEAN DEFAULT FALSE,
                    reset_token VARCHAR(255),
                    reset_token_expires DATETIME
                )
            `);
            console.log('Tabela "users" criada durante o beforeEach (se não existia).');
        }
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(server)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    password: 'Password123!'
                });

            expect(res.statusCode).to.equal(201);
            expect(res.body).to.have.property('message').equal('Usuário registrado com sucesso!');
        });

        it('should return 409 if username already exists', async () => {
            // Primeiro, registra o usuário
            await request(server)
                .post('/api/auth/register')
                .send({
                    username: 'existinguser',
                    password: 'Password123!'
                });

            // Tenta registrar o mesmo usuário novamente
            const res = await request(server)
                .post('/api/auth/register')
                .send({
                    username: 'existinguser',
                    password: 'AnotherPassword!'
                });

            expect(res.statusCode).to.equal(409);
            expect(res.body).to.have.property('message').equal('Nome de usuário já existe.');
        });
    });

    describe('POST /api/auth/login', () => {
        // Antes dos testes de login, registra um usuário para ser usado no login
        beforeEach(async () => {
            await request(server)
                .post('/api/auth/register')
                .send({
                    username: 'loginuser',
                    password: 'LoginPass123!'
                });
        });

        it('should login a user successfully with correct credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'LoginPass123!'
                });

            expect(res.statusCode).to.equal(200);
            expect(res.body).to.have.property('message').equal('Login bem-sucedido!');
            expect(res.body).to.have.property('token');
            expect(res.body.token).to.be.a('string');
        });

        it('should return 400 with invalid credentials for wrong password', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'WrongPassword!'
                });

            expect(res.statusCode).to.equal(400);
            expect(res.body).to.have.property('message').equal('Credenciais inválidas.');
        });

        // Teste para Bloqueio de Conta - Este é o teste do requisito 1.3!
        it('should lock account after multiple failed login attempts', async () => {
            const maxAttempts = 3; // Refere-se à sua constante MAX_LOGIN_ATTEMPTS no authController

            // Tentar login com senha incorreta 'maxAttempts' vezes
            for (let i = 0; i < maxAttempts -1 ; i++) { // -1 porque a última tentativa será testada separadamente
                const res = await request(server)
                    .post('/api/auth/login')
                    .send({
                        username: 'loginuser',
                        password: 'WrongPassword!'
                    });
                expect(res.statusCode).to.equal(400);
                expect(res.body).to.have.property('message').equal('Credenciais inválidas.');
            }

            // A última tentativa deve resultar em bloqueio
            const resFinal = await request(server)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'WrongPassword!'
                });
            
            expect(resFinal.statusCode).to.equal(400); // Ou 403 dependendo da sua implementação final para bloqueio
            // Verifica se a mensagem contém a frase de bloqueio
            expect(resFinal.body.message).to.include('Conta bloqueada');
            expect(resFinal.body.message).to.include('Muitas tentativas de login falhas');
            // Nota: O seu authController retorna 400 para muitas falhas, mas 403 se JÁ estiver bloqueada.
            // Aqui ele retorna 400 porque é a tentativa que CAUSA o bloqueio.
        });
    });
});