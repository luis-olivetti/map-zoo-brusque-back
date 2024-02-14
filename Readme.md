# Map-Zoo-Brusque-Back

Este projeto implementa um servidor JSON utilizando o [JSON Server](https://github.com/typicode/json-server) integrado ao Google Cloud Storage para armazenamento de dados. Ele fornece uma API para manipulação de informações sobre marcadores em um mapa.

## Funcionalidades Principais

- **Autenticação com JWT:** O servidor suporta autenticação usando tokens JWT (JSON Web Tokens).
- **Armazenamento Seguro:** Os dados dos marcadores são armazenados no Google Cloud Storage, garantindo persistência e segurança.
- **Operações CRUD:** Os usuários podem realizar operações CRUD (Create, Read, Update, Delete) nos recursos disponíveis.

## Instalação

1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.
2. Clone este repositório ou faça o download do código.
3. Instale as dependências executando o seguinte comando no terminal:

```shell
$ npm install
```

## Configuração

Antes de executar o servidor, é necessário configurar algumas variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto e defina as seguintes variáveis:

- `GOOGLE_CLOUD_PROJECT`: ID do projeto do Google Cloud.
- `GCLOUD_KEYFILE_PATH`: Caminho para o arquivo de chave de autenticação do Google Cloud.
- `GCLOUD_BUCKET_NAME`: Nome do bucket do Google Cloud Storage para armazenamento dos dados.
- `JWT_SECRET`: Segredo usado para assinar tokens JWT.
- `JSON_SERVER_USERNAME`: Nome de usuário para autenticação.
- `JSON_SERVER_PASSWORD`: Senha para autenticação.
- `SECONDARY_TOKEN`: Token secundário para operações específicas.

## Execução

Após configurar as variáveis de ambiente, você pode iniciar o servidor executando o seguinte comando:

```shell
npm start
```

O servidor será iniciado na porta especificada nas variáveis de ambiente ou na porta padrão 3000.

## Endpoints da API

### Autenticação

#### `POST /login`

- Rota para autenticar usuários e obter um token JWT.
- **Parâmetros do Corpo da Requisição:**
  - `username`: Nome de usuário.
  - `password`: Senha.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta:
    ```
    {
      "token": "<token_jwt>"
    }
    ```
- **Resposta de Erro:**
  - Código 401 ou 403 em caso de credenciais inválidas ou token expirado.

### Recursos de marcadores no Mapa

#### `GET /markers`

- Rota para obter todos os marcadores no mapa.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta: Array contendo informações de todos os marcadores.

#### `GET /markers/:id`

- Rota para obter informações de um marcador específico pelo ID.
- **Parâmetros da URL:**
  - `id`: ID do marcador desejado.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta: Informações do marcador com o ID especificado.
- **Resposta de Erro:**
  - Código 404 em caso de marcador não encontrado.

#### `POST /markers`

- Rota para adicionar um novo marcador ao mapa.
- **Parâmetros do Corpo da Requisição:**
  - Dados do marcador a ser adicionado.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta: Informações do marcador adicionado.
- **Resposta de Erro:**
  - Código 400 ou 403 em caso de requisição mal formada ou token secundário inválido.

#### `PUT /markers/:id`

- Rota para atualizar informações de um marcador existente.
- **Parâmetros da URL:**
  - `id`: ID do marcador a ser atualizado.
- **Parâmetros do Corpo da Requisição:**
  - Novos dados do marcador.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta: Informações do marcador atualizado.
- **Resposta de Erro:**
  - Código 400, 403 ou 404 em caso de requisição mal formada, token secundário inválido ou marcador não encontrado.

#### `DELETE /markers/:id`

- Rota para excluir um marcador do mapa.
- **Parâmetros da URL:**
  - `id`: ID do marcador a ser excluído.
- **Resposta de Sucesso:**
  - Código 200
  - Corpo da Resposta: Array contendo informações atualizadas dos marcadores.
- **Resposta de Erro:**
  - Código 400, 403 ou 404 em caso de requisição mal formada, token secundário inválido ou marcador não encontrado.
