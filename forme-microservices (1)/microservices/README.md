# ForME – Microservices Architecture (Séance 2)

## Architecture Overview

```
Client (Postman / Frontend)
          │
          ▼  :8080
   ┌─────────────┐
   │  API Gateway │   ← routes all traffic
   └──────┬──────┘
          │  discovers services via Eureka
          ▼  :8761
   ┌─────────────┐
   │Eureka Server│   ← service registry
   └──────┬──────┘
          │  registered services
          ▼  :8081
   ┌─────────────┐
   │ User Service│   ← auth, users, roles (your original backend)
   └──────┬──────┘
          │
          ▼  :3306
       MySQL
```

---

## Project Structure

```
forme-microservices/
├── pom.xml                  ← Parent Maven POM (manages all modules)
├── docker-compose.yml       ← DevOps: orchestrates all containers
│
├── eureka-server/           ← Module 1: Service Discovery (port 8761)
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/tn/esprit/eurekaserver/EurekaServerApplication.java
│       └── resources/application.yml
│
├── api-gateway/             ← Module 2: API Gateway (port 8080)
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/tn/esprit/gateway/ApiGatewayApplication.java
│       └── resources/application.yml
│
└── user-service/            ← Module 3: User Microservice (port 8081)
    ├── pom.xml
    ├── Dockerfile
    └── src/main/
        ├── java/tn/esprit/forme/   ← All your original source code
        └── resources/application.yml
```

---

## Running Locally (without Docker)

> Start services **in this exact order**.

### 1. Start Eureka Server
```bash
cd eureka-server
mvn spring-boot:run
# → Open http://localhost:8761 to see the Eureka dashboard
```

### 2. Start API Gateway
```bash
cd api-gateway
mvn spring-boot:run
# → Gateway now listens on http://localhost:8080
```

### 3. Start User Service
```bash
cd user-service
mvn spring-boot:run
# → Service registers itself with Eureka automatically
# → Refresh http://localhost:8761 → you should see USER-SERVICE listed
```

---

## Running with Docker (DevOps approach)

### Prerequisites
- Docker Desktop installed and running
- Build the JARs first:
```bash
# From the root of forme-microservices/
mvn clean package -DskipTests
```

### Start everything
```bash
docker-compose up --build
```

### Stop everything
```bash
docker-compose down
```

---

## Testing the Routing via Gateway

All requests go through the **API Gateway on port 8080**.
The gateway forwards them to the **user-service on port 8081**.

### Register a new user
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@test.com",
  "password": "Password123!"
}
```

### Login
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john.doe@test.com",
  "password": "Password123!"
}
```

### Get current user (authenticated)
```
GET http://localhost:8080/api/users/me
Authorization: Bearer <token_from_login>
```

### Login as Super Admin
```
POST http://localhost:8080/api/auth/login
{
  "email": "superadmin@forme.tn",
  "password": "SuperAdmin123!"
}
```

---

## Port Summary

| Service       | Port  | URL                          |
|---------------|-------|------------------------------|
| Eureka Server | 8761  | http://localhost:8761        |
| API Gateway   | 8080  | http://localhost:8080        |
| User Service  | 8081  | http://localhost:8081 (direct)|
| MySQL         | 3306  | jdbc:mysql://localhost:3306  |

---

## Key Spring Cloud Concepts Used

**Eureka Server** (`@EnableEurekaServer`)
- Acts as the phone book of the system
- All services register here on startup
- Dashboard shows all registered instances

**Eureka Client** (`@EnableDiscoveryClient`)
- Added to both `api-gateway` and `user-service`
- Services announce themselves to Eureka with their IP + port

**API Gateway** (Spring Cloud Gateway)
- Single entry point for all clients
- Routes `/api/auth/**` → `user-service`
- Routes `/api/users/**` → `user-service`
- Uses `lb://user-service` URI (lb = load balancer, resolves via Eureka)
- Auto-discovery also enabled: any service in Eureka is reachable at `/<service-name>/**`

---

## DevOps – Docker Notes

Each service has a `Dockerfile` using the lightweight `eclipse-temurin:17-jre-alpine` image.

`docker-compose.yml` defines:
- **Health checks** so services wait for their dependencies before starting
- **Environment variable overrides** to switch from `localhost` to container hostnames
- **A shared bridge network** (`forme-net`) so containers can reach each other by name
- **A named volume** for MySQL data persistence

### Useful Docker commands
```bash
docker ps                          # see running containers
docker logs eureka-server          # check eureka logs
docker logs user-service           # check user-service logs
docker-compose down -v             # stop and remove volumes (fresh DB)
```
