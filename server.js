const cors = require('cors');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
require('dotenv').config();

const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Configuração do Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GCLOUD_KEYFILE_PATH,
});
const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

server.use(cors());
server.use(middlewares);
server.use(jsonServer.bodyParser);

const jwtSecret = process.env.JWT_SECRET;

// Middleware para verificar o token JWT
server.use(verifyToken);

function hashString(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

server.post('/login', handleLogin);
server.post('/markers', handlePostMarkers);
server.put('/markers/:id', handlePutMarkers);
server.get('/markers', handleGetMarkers);
server.get('/markers/:id', handleGetMarkerById);
server.delete('/markers/:id', handleDeleteMarker);


const PORT = process.env.PORT || 3000;
server.listen(PORT);

async function verifyToken(req, res, next) {
  if (req.path === '/login') {
    return next();
  }

  if (req.method === 'GET' && req.path.startsWith('/markers') && !req.path.startsWith('/markers/')) {
    return next();
  }

  const token = req.headers.authorization;

  if (token && token.startsWith('Bearer ')) {
    const tokenWithoutBearer = token.slice(7);
    try {
      const decoded = jwt.verify(tokenWithoutBearer, jwtSecret);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp <= currentTimestamp) {
        return res.status(403).send('Token expired');
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).send('Invalid token');
    }
  } else {
    res.status(401).send('Token not provided');
  }
}

async function handleLogin(req, res) {
  const { username, password } = req.body;

  const hashedUsername = hashString(username);
  const hashedPassword = hashString(password);

  if (hashedUsername === process.env.JSON_SERVER_USERNAME && hashedPassword === process.env.JSON_SERVER_PASSWORD) {
    const token = jwt.sign({ username }, jwtSecret, { expiresIn: '5m' });
    res.json({ token });
  } else {
    res.status(401).send('Invalid credentials');
  }
}

async function handlePostMarkers(req, res) {
  const file = bucket.file('db.json');

  const secondaryToken = req.headers.secondarytoken;

  if (!secondaryToken) {
    res.status(400).send('Bad Request');
    return;
  }

  const hashedSecondaryToken = hashString(secondaryToken);

  if (hashedSecondaryToken !== process.env.SECONDARY_TOKEN) {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const [content] = await file.download();
    const data = JSON.parse(content.toString());
    const newData = req.body;

    if (!Array.isArray(data.trucksOnMap)) {
      data.trucksOnMap = [];
    }

    newData.id = data.trucksOnMap.length + 1;
    data.trucksOnMap.push(newData);

    await file.save(JSON.stringify(data));

    res.json(newData);
  } catch (error) {
    console.error('Erro ao processar dados ou salvar no Google Cloud Storage:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function handlePutMarkers(req, res) {
  const file = bucket.file('db.json');

  try {
    const [content] = await file.download();
    const data = JSON.parse(content.toString());
    const newData = req.body;

    const index = data.trucksOnMap.findIndex(item => item.id === parseInt(req.params.id));

    if (index !== -1) {
      data.trucksOnMap[index] = newData;

      await file.save(JSON.stringify(data));

      res.json(newData);
    } else {
      console.error('Item não encontrado para atualização.');
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Erro ao processar dados ou salvar no Google Cloud Storage:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function handleGetMarkers(req, res) {
  const file = bucket.file('db.json');

  try {
    const [content] = await file.download();
    const data = JSON.parse(content.toString());

    if ('trucksOnMap' in data) {
      res.json(data.trucksOnMap);
    } else {
      console.error('A propriedade "trucksOnMap" não foi encontrada no arquivo JSON.');
      res.status(500).send('Internal Server Error');
      return;
    }
  } catch (error) {
    console.error('Erro ao ler o arquivo do Google Cloud Storage:', error);
    res.status(500).send('Internal Server Error');
    return;
  }
}

async function handleGetMarkerById(req, res) {
  const file = bucket.file('db.json');

  const secondaryToken = req.headers.secondarytoken;

  if (!secondaryToken) {
    res.status(400).send('Bad Request');
    return;
  }

  const hashedSecondaryToken = hashString(secondaryToken);

  if (hashedSecondaryToken !== process.env.SECONDARY_TOKEN) {
    res.status(403).send('Forbidden');
    return;
  }

  const id = req.params.id;

  if (!id || isNaN(id)) {
    console.error('ID inválido fornecido.');
    res.status(400).send('Bad Request');
    return;
  }

  try {
    const [content] = await file.download();
    const data = JSON.parse(content.toString());

    if ('trucksOnMap' in data) {
      const truck = data.trucksOnMap.find(item => item.id === parseInt(id));

      if (truck) {
        res.json(truck);
      } else {
        console.error('Item não encontrado para o ID fornecido.');
        res.status(404).send('Not Found');
      }
    } else {
      console.error('A propriedade "trucksOnMap" não foi encontrada no arquivo JSON.');
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    console.error('Erro ao ler o arquivo do Google Cloud Storage:', error);
    res.status(500).send('Internal Server Error');
  }
}

async function handleDeleteMarker(req, res) {
  const file = bucket.file('db.json');

  const secondaryToken = req.headers.secondarytoken;

  if (!secondaryToken) {
    res.status(400).send('Bad Request');
    return;
  }

  const hashedSecondaryToken = hashString(secondaryToken);

  if (hashedSecondaryToken !== process.env.SECONDARY_TOKEN) {
    res.status(403).send('Forbidden');
    return;
  }

  const id = req.params.id;

  if (!id || isNaN(id)) {
    console.error('ID inválido fornecido.');
    res.status(400).send('Bad Request');
    return;
  }

  try {
    const [content] = await file.download();
    const data = JSON.parse(content.toString());

    if ('trucksOnMap' in data) {
      const index = data.trucksOnMap.findIndex(item => item.id === parseInt(id));

      if (index !== -1) {
        data.trucksOnMap.splice(index, 1);

        // Salvar os dados modificados de volta no arquivo do bucket
        await file.save(JSON.stringify(data));

        // Responder com os dados modificados (opcional)
        res.json(data.trucksOnMap);
      } else {
        console.error('Item não encontrado para exclusão.');
        res.status(404).send('Not Found');
      }
    } else {
      console.error('A propriedade "trucksOnMap" não foi encontrada no arquivo JSON.');
      res.status(500).send('Internal Server Error');
    }
  } catch (error) {
    console.error('Erro ao ler ou salvar o arquivo do Google Cloud Storage:', error);
    res.status(500).send('Internal Server Error');
  }
}