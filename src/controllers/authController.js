// Adicionei comentários para estudos e facilitar manuntenção

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateRandomToken } from '../utils/tokenUtils.js';

// Configurações para bloqueio de conta
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME_MINUTES = 5;

// Função de Registro
export const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(username, hashedPassword);
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nome de usuário já existe.' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Função de Login
export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findByUsername(username);

        // Debug: Log do usuário encontrado e seu status inicial
        console.log(`--- Tentativa de Login para: ${username} ---`);
        console.log(`Dados iniciais do usuário:`, user);

        if (!user) {
            console.log('Usuário não encontrado.');
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // --- Lógica de Bloqueio de Conta ---
        if (user.is_locked) {
            const now = new Date();
            const lastAttemptTime = new Date(user.last_attempt);

            const unlockTime = new Date(lastAttemptTime.getTime() + LOCK_TIME_MINUTES * 60 * 1000);

            console.log(`Conta bloqueada. Tempo atual: ${now.toISOString()}, Última tentativa: ${lastAttemptTime.toISOString()}, Desbloqueia em: ${unlockTime.toISOString()}`);

            if (now < unlockTime) {
                const remainingMinutes = Math.ceil((unlockTime - now) / (60 * 1000));
                console.log(`Conta ainda bloqueada por ${remainingMinutes} minutos.`);
                return res.status(403).json({ message: `Conta bloqueada. Por favor, tente novamente em ${remainingMinutes} minutos.` });
            } else {
                console.log('Tempo de bloqueio expirado. Resetando tentativas de login.');
                await User.resetLoginAttempts(user.id);
                user = await User.findByUsername(username); // Re-busca o usuário para ter os dados atualizados
                console.log('Usuário re-buscado após reset de bloqueio:', user);
            }
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Senha incorreta.');
            const newAttempts = user.login_attempts + 1;
            const now = new Date();
            let isLocked = false;
            let message = 'Credenciais inválidas.';

            // Debug: Log das novas tentativas e se vai bloquear
            console.log(`Novas tentativas: ${newAttempts}. Limite: ${MAX_LOGIN_ATTEMPTS}`);

            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                isLocked = true;
                message = `Muitas tentativas de login falhas. Conta bloqueada por ${LOCK_TIME_MINUTES} minutos.`;
                console.log('ATENÇÃO: Tentativas atingiram o limite! Marcando para bloquear.');
            }

            // ATUALIZA login_attempts, last_attempt E is_locked de uma vez
            await User.updateLoginAttemptsAndLockStatus(user.id, newAttempts, now, isLocked);
            console.log(`Status atualizado no DB: tentativas=${newAttempts}, is_locked=${isLocked}`);


            return res.status(400).json({ message });
        }

        // Senha correta
        console.log('Senha correta. Resetando tentativas de login.');
        await User.resetLoginAttempts(user.id);

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- FUNÇÕES DE ESQUECI/REDEFINIR SENHA ---
// Certifique-se de que estas funções ESTÃO AQUI e exportadas com 'export const'
export const forgotPassword = async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const resetToken = generateRandomToken();
        const resetTokenExpires = new Date(Date.now() + 3600000); // Token válido por 1 hora

        await User.updateResetToken(user.id, resetToken, resetTokenExpires);

        res.status(200).json({ message: 'Token de redefinição de senha gerado.', resetToken });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findByResetToken(token);

        if (!user || new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({ message: 'Token de redefinição inválido ou expirado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.id, hashedPassword);
        await User.clearResetToken(user.id);

        res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Exporta todas as funções como um objeto padrão
export default {
    register,
    login,
    forgotPassword, // ESTE AQUI PRECISA ESTAR DEFINIDO ACIMA
    resetPassword   // E ESTE TAMBÉM
};