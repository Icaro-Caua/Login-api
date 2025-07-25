// src/app.js

import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas no início
import express from 'express';
// import bodyParser from 'body-parser'; // Esta linha não é necessária se você usar express.json()
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js'; // Assumindo que este arquivo e exportação existem e estão corretos
import authRoutes from './routes/authRoutes.js';
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para analisar corpos de requisição JSON (substitui bodyParser.json())
app.use(express.json());

// Rotas da API de autenticação
app.use('/api/auth', authRoutes);

// Servir arquivos estáticos (seu frontend em 'public')
app.use(express.static('public'));

// Configuração do Swagger para documentação da API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota de teste simples para verificar se a API está funcionando
app.get('/', (req, res) => {
    res.send('API Login GENAI está funcionando!');
});

// Inicializa a tabela do banco de dados
// Esta função é chamada uma vez quando o aplicativo é carregado/iniciado,
// garantindo que a estrutura do DB esteja pronta.
User.createTable();

// EXPORTAÇÃO DA INSTÂNCIA 'app'
// Isso é CRUCIAL! Permite que outros arquivos (como seus testes)
// importem a sua aplicação Express sem iniciar o servidor HTTP.
export default app;

// Lógica para iniciar o servidor Express SOMENTE se este arquivo for o ponto de entrada principal.
// Se 'app.js' for importado por outro módulo (como nos testes), esta parte NÃO será executada.
// Nos testes, o Supertest cria seu próprio servidor HTTP temporário usando a instância 'app' que foi exportada.
if (process.argv[1] === new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') || process.env.NODE_ENV === 'development') {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
    });
}