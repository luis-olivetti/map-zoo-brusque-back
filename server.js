const cors = require('cors');
const jsonServer = require('json-server');
const basicAuth = require('basic-auth');
require('dotenv').config();

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(middlewares);

server.use((req, res, next) => {
  const user = basicAuth(req);

  const username = process.env.JSON_SERVER_USERNAME;
  const password = process.env.JSON_SERVER_PASSWORD;

  if (!user || user.name !== username || user.pass !== password) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.status(401).send('Unauthorized');
  }

  next();
});

server.use(router);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`JSON Server está rodando em http://localhost:${PORT}`);
});
