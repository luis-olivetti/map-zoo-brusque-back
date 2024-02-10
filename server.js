const cors = require('cors');
const jsonServer = require('json-server');
const basicAuth = require('basic-auth');
const { Storage } = require('@google-cloud/storage');
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

server.use((req, res, next) => {
  const user = basicAuth(req);

  const username = process.env.JSON_SERVER_USERNAME;
  const password = process.env.JSON_SERVER_PASSWORD;
  const origin = req.headers.origin;
  const trustedOrigins = [process.env.ORIGIN_HTTPS, process.env.ORIGIN_HTTP];

  if (!trustedOrigins.includes(origin)) {
    return res.status(403).send('Forbidden - Invalid origin');
  }

  if (!user || user.name !== username || user.pass !== password) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.status(401).send('Unauthorized');
  }

  next();
});


// Middleware para manipular a rota "markers"
server.use('/markers', async (req, res, next) => {
  const file = bucket.file('db.json');

  if (req.method === 'GET') {
    if (/\/\d+$/.test(req.url)) {
      const id = req.url.split('/').pop(); // Obtém o ID do final da URL

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
          return;
        }
      } catch (error) {
        console.error('Erro ao ler o arquivo do Google Cloud Storage:', error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      // Para GET, leia o arquivo do bucket
      try {
        const [content] = await file.download();
        const data = JSON.parse(content.toString());

        // Verifique se a propriedade 'trucksOnMap' existe no objeto
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

  } else if (req.method === 'POST' || req.method === 'PUT') {
    let rawData = '';

    req.on('data', (chunk) => {
      rawData += chunk;
    });

    req.on('end', async () => {
      // Processar dados recebidos (para POST ou PUT)
      try {
        const [content] = await file.download();
        const data = JSON.parse(content.toString());

        // Adicionar ou atualizar dados com base nos dados recebidos
        // (rawData contém os dados do corpo da solicitação)
        const newData = JSON.parse(rawData);

        if (!Array.isArray(data.trucksOnMap)) {
          data.trucksOnMap = [];
        }

        if (req.method === 'POST') {
          // Adicionar novo item
          newData.id = data.trucksOnMap.length + 1;
          data.trucksOnMap.push(newData);
        } else if (req.method === 'PUT') {
          // Atualizar item existente
          const index = data.trucksOnMap.findIndex(item => item.id === newData.id);

          if (index !== -1) {
            data.trucksOnMap[index] = newData;
          } else {
            console.error('Item não encontrado para atualização.');
            res.status(404).send('Not Found');
            return;
          }
        }

        // Salvar os dados modificados de volta no arquivo do bucket
        await file.save(JSON.stringify(data));

        // Responder com os dados modificados (opcional)
        res.json(newData);
      } catch (error) {
        console.error('Erro ao processar dados ou salvar no Google Cloud Storage:', error);
        res.status(500).send('Internal Server Error');
        return;
      }
    });
  } else if (req.method === 'DELETE' && /\/\d+$/.test(req.url)) {
    const id = req.url.split('/').pop();

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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server está rodando em http://localhost:${PORT}`);
});
