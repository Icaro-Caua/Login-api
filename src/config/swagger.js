// Adicionei comentários para estudos e facilitar manuntenção


import fs from 'fs'; // Importa o módulo 'fs' para ler arquivos
import yaml from 'js-yaml'; // Importa 'js-yaml' para parsear YAML
import swaggerUi from 'swagger-ui-express'; // Será importado em app.js

// Carrega o conteúdo do arquivo swagger.yaml
const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));

// swagger-jsdoc não é mais necessário para parsear JSDoc
// Mas vamos retornar o documento direto
const swaggerSpec = swaggerDocument;

export default swaggerSpec;