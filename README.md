# Sistema de Notificações (NestJS + Angular + RabbitMQ)

Projeto full-stack com backend em NestJS, frontend em Angular e mensageria via RabbitMQ. O fluxo: o frontend envia uma notificação com `mensagemId` e `conteudoMensagem` para o backend; o backend enfileira na RabbitMQ e, após um processamento simulado, publica um status que é consultado periodicamente pelo frontend.

## Tecnologias
- Backend: NestJS (Node 20), amqplib
- Frontend: Angular standalone components
- Mensageria: RabbitMQ (imagem 3-management)
- Orquestração: Docker Compose

## Requisitos
- Docker e Docker Compose
- Porta 3000 (API), 4200 (frontend) e 15672/5672 (RabbitMQ) livres

## Como subir com Docker
```bash
# Na raiz do repositório
docker compose pull
docker compose build --no-cache
docker compose up -d

# Logs
docker compose logs -f backend | cat
```

- Backend: `http://localhost:3000` (API base `/api`)
- Frontend: `http://localhost:4200`
- RabbitMQ Management: `http://localhost:15672` (user: guest / pass: guest)

O Compose define healthcheck no serviço `rabbitmq` e faz o `backend` aguardar `service_healthy` antes de iniciar, mitigando falhas de conexão.

## Variáveis de ambiente
- Backend
  - `PORT` (default 3000)
  - `MEU_NOME` (default `matheus`) — compõe os nomes das filas
  - `RABBITMQ_URL` (default `amqp://guest:guest@rabbitmq:5672` no Docker; fallback local `amqp://guest:guest@localhost:5672`)
- Frontend
  - `NG_APP_API_URL` (default `http://localhost:3000/api` via `docker-compose.yml`)

## Endpoints da API (Backend)
Base URL: `http://localhost:3000/api`

- POST `/notificar`
  - Body JSON:
    ```json
    { "mensagemId": "uuid", "conteudoMensagem": "texto" }
    ```
  - Resposta `202 Accepted`:
    ```json
    { "mensagemId": "uuid", "status": "AGUARDANDO_PROCESSAMENTO" }
    ```

- GET `/notificacao/status/:mensagemId`
  - Resposta `200 OK`:
    ```json
    { "mensagemId": "uuid", "status": "PROCESSADO_SUCESSO" | "FALHA_PROCESSAMENTO" | "AGUARDANDO_PROCESSAMENTO" | null }
    ```

## Fluxo de Mensageria
- Filas utilizadas (dependem de `MEU_NOME`):
  - Entrada: `fila.notificacao.entrada.<MEU_NOME>`
  - Status: `fila.notificacao.status.<MEU_NOME>`
- O backend:
  - Conecta ao RabbitMQ com tentativa e backoff exponencial
  - Declara as filas acima como duráveis
  - Publica mensagens de entrada e, após processamento simulado, publica status

## Desenvolvimento local (sem Docker)
Backend:
```bash
cd backend
npm ci
npm run start:dev
```
Requer um RabbitMQ local em `amqp://guest:guest@localhost:5672` ou definir `RABBITMQ_URL`.

Frontend:
```bash
cd frontend
npm ci
npm run start
# Acesse http://localhost:4200
```
Se necessário, defina `NG_APP_API_URL` no ambiente do navegador (o projeto já injeta via Compose para uso em Docker).

## Testes
- Backend:
```bash
cd backend
npm test
npm run test:cov
```
- Frontend: (exemplo padrão Angular)
```bash
cd frontend
npm test
```

## Troubleshooting
- Erro `ECONNREFUSED :5672` no backend
  - Aguarde o healthcheck do RabbitMQ ficar `healthy` (o backend já faz retry)
  - Verifique UI do RabbitMQ: `http://localhost:15672` (guest/guest)
  - Inspecione health: `docker inspect --format='{{json .State.Health}}' desafio-rabbitmq | jq`
  - Confirme `RABBITMQ_URL` no log do backend

- Frontend não acessa API
  - Confirme `backend` está ouvindo em `:3000` e variável `NG_APP_API_URL`

- Portas em uso
  - Ajuste mapeamentos em `docker-compose.yml` conforme necessário

## Estrutura do projeto
```
./
  backend/  # NestJS API e integração RabbitMQ
  frontend/ # Angular app
  docker-compose.yml
```

## Licença
MIT LICENSE

