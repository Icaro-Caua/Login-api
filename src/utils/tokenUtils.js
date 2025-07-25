// Adicionei comentários para estudos e facilitar manuntenção

import crypto from 'crypto';

export const generateRandomToken = () => {
    // Gera um token aleatório de 32 bytes e o converte para uma string hexadecimal
    return crypto.randomBytes(32).toString('hex');
};