# Technical Test Backend

Prueba técnica desarrollada con **Node.js**, **Express**, **MySQL**, **Docker Compose** y **Serverless Framework**.

El proyecto implementa:

- **Customers API**
- **Orders API**
- **Lambda Orchestrator**

El flujo principal permite:

1. gestionar clientes
2. gestionar productos y stock
3. crear órdenes para clientes existentes
4. confirmar órdenes de forma idempotente
5. cancelar órdenes restaurando stock según reglas
6. orquestar creación + confirmación desde un endpoint Lambda HTTP

---

## Arquitectura

El proyecto está organizado como un monorepo con tres componentes principales:

- **customers-api**  
  Maneja clientes, autenticación JWT simple y endpoint interno protegido con `SERVICE_TOKEN`.

- **orders-api**  
  Maneja productos, órdenes, confirmación idempotente y cancelación con restauración de stock.

- **lambda-orchestrator**  
  Expone un endpoint HTTP que consulta cliente, crea la orden y la confirma, devolviendo un JSON consolidado.

- **db**  
  Contiene `schema.sql` y `seed.sql`.

---

## Estructura del repositorio

```text
technical-test-backend
├── customers-api
│   ├── src
│   │   ├── db
│   │   ├── middlewares
│   │   ├── modules
│   │   │   └── customers
│   │   ├── routes
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── Dockerfile
│   ├── openapi.yaml
│   └── package.json
├── orders-api
│   ├── src
│   │   ├── db
│   │   ├── middlewares
│   │   ├── modules
│   │   │   ├── orders
│   │   │   └── products
│   │   ├── routes
│   │   ├── services
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── Dockerfile
│   ├── openapi.yaml
│   └── package.json
├── lambda-orchestrator
│   ├── src
│   │   ├── handlers
│   │   └── services
│   ├── .env.example
│   ├── package.json
│   └── serverless.yml
├── db
│   ├── schema.sql
│   └── seed.sql
├── postman
│   ├── technical-test-backend.postman_collection.json
│   └── technical-test-backend.postman_environment.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Requisitos previos

Instalar lo siguiente:

- Node.js
- npm
- Docker Desktop
- VS Code o editor equivalente

Para el desarrollo del Lambda local se utilizó:

- **Serverless Framework**
- **serverless-offline**

---

## Variables de entorno

### customers-api/.env.example

```env
PORT=3001
DB_HOST=mysql
DB_PORT=3306
DB_NAME=backend_test
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=supersecret
SERVICE_TOKEN=service-secret-token
AUTH_USER=admin@test.com
AUTH_PASSWORD=123456
```

### orders-api/.env.example

```env
PORT=3002
DB_HOST=mysql
DB_PORT=3306
DB_NAME=backend_test
DB_USER=root
DB_PASSWORD=root
JWT_SECRET=supersecret
SERVICE_TOKEN=service-secret-token
AUTH_USER=admin@test.com
AUTH_PASSWORD=123456
CUSTOMERS_API_BASE=http://customers-api:3001
```

### lambda-orchestrator/.env.example

```env
CUSTOMERS_API_BASE=http://localhost:3001
ORDERS_API_BASE=http://localhost:3002
SERVICE_TOKEN=service-secret-token
JWT_TOKEN=
```

---

## Base de datos

El proyecto utiliza MySQL 8 y se inicializa con:

- `db/schema.sql`
- `db/seed.sql`

### Tablas principales

- `customers`
- `products`
- `orders`
- `order_items`
- `idempotency_keys`

### Datos semilla incluidos

- clientes base
- productos base
- stock inicial

---

## Cómo levantar el proyecto con Docker

Desde la raíz del proyecto:

```bash
docker compose build
docker compose up -d
```

### Verificar contenedores

```bash
docker ps
```

### Verificar health checks en PowerShell

```powershell
irm http://localhost:3001/health
irm http://localhost:3002/health
```

---

## Customers API

### Base URL

```text
http://localhost:3001
```

### Endpoints principales

- `POST /auth/login`
- `POST /customers`
- `GET /customers`
- `GET /customers/:id`
- `PUT /customers/:id`
- `DELETE /customers/:id`
- `GET /internal/customers/:id`

### Login

```powershell
$response = irm http://localhost:3001/auth/login -Method Post -ContentType "application/json" -Body '{"email":"admin@test.com","password":"123456"}'
$token = $response.token
```

### Crear cliente

```powershell
irm http://localhost:3001/customers `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"name":"Cliente Demo","email":"demo@empresa.com","phone":"3001112233"}'
```

### Listar clientes

```powershell
irm http://localhost:3001/customers `
  -Headers @{ Authorization = "Bearer $token" }
```

### Consultar cliente interno

```powershell
irm http://localhost:3001/internal/customers/1 `
  -Headers @{ Authorization = "Bearer service-secret-token" }
```

---

## Orders API

### Base URL

```text
http://localhost:3002
```

### Endpoints principales

#### Productos

- `POST /auth/login`
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PATCH /products/:id`

#### Órdenes

- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/confirm`
- `POST /orders/:id/cancel`

### Login

```powershell
$responseOrders = irm http://localhost:3002/auth/login -Method Post -ContentType "application/json" -Body '{"email":"admin@test.com","password":"123456"}'
$tokenOrders = $responseOrders.token
```

### Listar productos

```powershell
irm http://localhost:3002/products `
  -Headers @{ Authorization = "Bearer $tokenOrders" }
```

### Crear producto

```powershell
irm http://localhost:3002/products `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $tokenOrders" } `
  -Body '{"sku":"SKU-HEADSET","name":"Headset","price_cents":89900,"stock":15}'
```

### Crear orden

```powershell
irm http://localhost:3002/orders `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $tokenOrders" } `
  -Body '{"customer_id":1,"items":[{"product_id":2,"qty":2}]}'
```

### Confirmar orden con idempotencia

```powershell
irm http://localhost:3002/orders/1/confirm `
  -Method Post `
  -Headers @{ Authorization = "Bearer $tokenOrders"; "X-Idempotency-Key" = "abc-123" }
```

### Cancelar orden

```powershell
irm http://localhost:3002/orders/2/cancel `
  -Method Post `
  -Headers @{ Authorization = "Bearer $tokenOrders" }
```

---

## Lambda Orchestrator

### Base URL local

```text
http://localhost:3000
```

### Endpoint

```text
POST /orchestrator/create-and-confirm-order
```

### Levantar localmente

Desde `lambda-orchestrator`:

```bash
npm install
npm run dev
```

### Ejemplo de request

```powershell
irm http://localhost:3000/orchestrator/create-and-confirm-order `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"customer_id":1,"items":[{"product_id":1,"qty":1}],"idempotency_key":"lambda-001","correlation_id":"req-001"}'
```

### Ejemplo de response esperada

```json
{
  "success": true,
  "correlationId": "req-001",
  "data": {
    "customer": {
      "id": 1,
      "name": "ACME Corp",
      "email": "ops@acme.com",
      "phone": "3001234567"
    },
    "order": {
      "id": 4,
      "customer_id": 1,
      "status": "CONFIRMED",
      "total_cents": 129900,
      "items": [
        {
          "product_id": 1,
          "qty": 1,
          "unit_price_cents": 129900,
          "subtotal_cents": 129900
        }
      ]
    }
  }
}
```

---

## Pruebas en Postman

Se incluye una colección Postman para facilitar las pruebas manuales del flujo completo:

- `postman/technical-test-backend.postman_collection.json`
- `postman/technical-test-backend.postman_environment.json`

### Variables del environment utilizadas

- `customers_base_url = http://localhost:3001`
- `orders_base_url = http://localhost:3002`
- `lambda_base_url = http://localhost:3000`
- `jwt_customers`
- `jwt_orders`
- `service_token = service-secret-token`
- `customer_id`
- `product_id`
- `order_id`
- `idempotency_key`

### Flujo probado manualmente en Postman

#### Customers API

- Login Customers
- Create Customer
- List Customers
- Internal Customer

#### Orders API

- Login Orders
- List Products
- Create Product
- Create Order
- Get Order By Id
- Confirm Order
- Cancel Order

#### Lambda Orchestrator

- Lambda Orchestrator

### Resultado de las pruebas

Se validó manualmente en Postman:

- autenticación en Customers API
- creación de cliente
- consulta de clientes
- acceso al endpoint interno protegido por `SERVICE_TOKEN`
- autenticación en Orders API
- consulta y creación de productos
- creación de órdenes
- confirmación de órdenes
- cancelación de órdenes según reglas
- invocación HTTP del Lambda Orchestrator con respuesta consolidada

---

## Ejemplos cURL

### cURL - Login Customers API

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"123456\"}"
```

### cURL - Crear cliente

```bash
curl -X POST http://localhost:3001/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d "{\"name\":\"Cliente Demo\",\"email\":\"demo@empresa.com\",\"phone\":\"3001112233\"}"
```

### cURL - Login Orders API

```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"123456\"}"
```

### cURL - Crear producto

```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ORDERS" \
  -d "{\"sku\":\"SKU-HEADSET\",\"name\":\"Headset\",\"price_cents\":89900,\"stock\":15}"
```

### cURL - Crear orden

```bash
curl -X POST http://localhost:3002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_ORDERS" \
  -d "{\"customer_id\":1,\"items\":[{\"product_id\":2,\"qty\":2}]}"
```

### cURL - Confirmar orden con idempotencia

```bash
curl -X POST http://localhost:3002/orders/1/confirm \
  -H "Authorization: Bearer TU_TOKEN_ORDERS" \
  -H "X-Idempotency-Key: abc-123"
```

### cURL - Cancelar orden

```bash
curl -X POST http://localhost:3002/orders/2/cancel \
  -H "Authorization: Bearer TU_TOKEN_ORDERS"
```

### cURL - Invocar Lambda Orchestrator local

```bash
curl -X POST http://localhost:3000/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d "{\"customer_id\":1,\"items\":[{\"product_id\":1,\"qty\":1}],\"idempotency_key\":\"lambda-001\",\"correlation_id\":\"req-001\"}"
```

---

## Invocación del Lambda en AWS

### Despliegue

Desde `lambda-orchestrator`:

```bash
serverless deploy
```

### Variables de entorno requeridas

El despliegue en AWS requiere configurar:

- `CUSTOMERS_API_BASE`
- `ORDERS_API_BASE`
- `SERVICE_TOKEN`

Estas variables deben apuntar a URLs públicas accesibles por el Lambda desplegado.

### Invocación

Una vez desplegado, se debe tomar la URL expuesta por API Gateway y hacer un `POST` al endpoint:

```text
https://TU_API_ID.execute-api.TU_REGION.amazonaws.com/orchestrator/create-and-confirm-order
```

### Ejemplo cURL en AWS

```bash
curl -X POST "https://TU_API_ID.execute-api.TU_REGION.amazonaws.com/orchestrator/create-and-confirm-order" \
  -H "Content-Type: application/json" \
  -d "{\"customer_id\":1,\"items\":[{\"product_id\":1,\"qty\":1}],\"idempotency_key\":\"aws-001\",\"correlation_id\":\"req-aws-001\"}"
```

---

## Reglas de negocio implementadas

### Customers

- email único
- validación con Zod
- autenticación JWT
- endpoint interno protegido con `SERVICE_TOKEN`

### Products

- SKU único
- actualización de precio y stock
- búsqueda por nombre o SKU

### Orders

- valida existencia del cliente en Customers API
- valida stock disponible
- crea orden en estado `CREATED`
- descuenta stock dentro de transacción
- confirma orden con idempotencia usando `X-Idempotency-Key`
- cancela orden `CREATED`
- cancela orden `CONFIRMED` solo dentro de 10 minutos
- restaura stock al cancelar

### Lambda

- valida request
- consulta cliente
- crea orden
- confirma orden
- retorna JSON consolidado

---

## Decisiones técnicas

- Se utilizó SQL parametrizado con `mysql2/promise`.
- Se evitó ORM para mantener control explícito sobre consultas y transacciones.
- Se utilizó `SELECT ... FOR UPDATE` para proteger stock en la creación de órdenes.
- La idempotencia se persistió en la tabla `idempotency_keys`.
- La paginación simple se implementó con `cursor` basado en `id`.
- La autenticación es mínima y simple, suficiente para la prueba técnica.

---

## Mejoras futuras

- pruebas automatizadas
- Swagger UI en ejecución
- manejo más robusto de expiración de idempotency keys
- logging estructurado
- manejo centralizado de errores
- mayor cobertura OpenAPI
- despliegue del Lambda en AWS

---

## Notas

- Para PowerShell se recomienda usar `irm` en lugar de `curl`.
- Para el entorno local del Lambda se utilizó `serverless-offline`.
- La ejecución local del Lambda requirió ajustar runtime y puertos para evitar conflictos.

---

## Nota técnica sobre el runtime del Lambda

La guía solicita runtime Node 22 para Lambda.  
La configuración objetivo para despliegue en AWS puede ajustarse a Node 22 según el entorno final.

Para la ejecución local se utilizó una configuración compatible con `serverless-offline`, debido a restricciones de compatibilidad del entorno local durante las pruebas.

---

## Estado final

El proyecto deja funcional:

- Customers API
- Orders API
- transacciones de órdenes
- confirmación idempotente
- cancelación con restauración de stock
- Lambda Orchestrator local