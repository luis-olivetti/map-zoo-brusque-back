const cors = require('cors');
const jsonServer = require('json-server');

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Habilita o CORS para todos os domínios
server.use(cors());

// Adiciona middleware padrão (logger, manipulação de erros, etc.)
server.use(middlewares);

// Usa o roteador JSON-Server com o middleware CORS
server.use(router);

// Define a porta para ouvir
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`JSON Server está rodando em http://localhost:${PORT}`);
});
