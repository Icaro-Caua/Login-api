// Adicionei comentários para estudos e facilitar manuntenção


import pool from '../config/db.js';

class User {
    static async createTable() {
        try {
            const query = `
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
            `;
            await pool.execute(query);
            console.log('Tabela "users" verificada/criada com sucesso.');
        } catch (error) {
            console.error('Erro ao criar/verificar tabela "users":', error);
            process.exit(1);
        }
    }

    static async create(username, password) {
        const [result] = await pool.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, password]
        );
        return result.insertId;
    }

    static async findByUsername(username) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    // NOVA FUNÇÃO: Atualiza tentativas e status de bloqueio
    static async updateLoginAttemptsAndLockStatus(userId, attempts, lastAttempt, isLocked) {
        console.log(`[User.js] Atualizando DB para userId: ${userId}, tentativas: ${attempts}, última tentativa: ${lastAttempt.toISOString()}, is_locked: ${isLocked}`);
        const [result] = await pool.execute(
            'UPDATE users SET login_attempts = ?, last_attempt = ?, is_locked = ? WHERE id = ?',
            [attempts, lastAttempt, isLocked, userId]
        );
        console.log(`[User.js] Resultado da atualização: affectedRows=${result.affectedRows}`);
        return result.affectedRows > 0;
    }

    static async resetLoginAttempts(userId) {
        console.log(`[User.js] Resetando tentativas de login para userId: ${userId}`);
        const [result] = await pool.execute(
            'UPDATE users SET login_attempts = 0, last_attempt = NULL, is_locked = FALSE WHERE id = ?',
            [userId]
        );
        console.log(`[User.js] Resultado do reset: affectedRows=${result.affectedRows}`);
        return result.affectedRows > 0;
    }

   
}

export default User;