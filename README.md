# ForME DevOps Sprint 3

## Project Overview

This repository is the centralized ForME Sprint 3 DevOps/CD setup.

- Angular frontend source is currently present in `FormeFront/` for local demo work.
- Spring Boot backend microservices are currently present in `forme-microservices (1)/` for local demo work.
- Kubernetes manifests: `k8s/`
- CI/CD pipelines: `Jenkinsfile`, `Jenkinsfile-user-service`, `Jenkinsfile-frontend`
- VM/infrastructure setup: `Vagrantfile`, `bootstrap.sh`

The Vagrant Ubuntu VM contains Jenkins, Docker, `kubectl`, and a local `k3s` Kubernetes cluster.

## Architecture

```text
Windows Host
  -> Vagrant Ubuntu VM
  -> Jenkins / Docker / kubectl / k3s
  -> Kubernetes namespace forme-education
```

## Start VM

From Windows PowerShell:

```bash
cd C:\Users\samib\OneDrive\Desktop\formefinall
vagrant up --no-provision
vagrant ssh
cd /vagrant
```

If `vagrant up --no-provision` times out during SSH startup, the VM may still be running:

```bash
vagrant status
vagrant ssh
```

If SSH stays unhealthy after a restart:

```bash
vagrant halt --force
vagrant up --no-provision
vagrant ssh
```

## URLs

- Jenkins: `http://localhost:8086`
- Prometheus: `http://localhost:30090`
- Grafana: `http://localhost:30300`
- SonarQube: `http://localhost:9000`

## Docker Images

Backend:

```text
samiwin/user-service:latest
```

Frontend:

```text
samiwin/forme-frontend:latest
```

## Jenkins Pipelines

- `Jenkinsfile-user-service`: backend CI/CD pipeline for Maven build, tests, coverage, SonarQube, Docker, and Kubernetes deploy.
- `Jenkinsfile-frontend`: frontend CI pipeline for npm install, Angular tests with coverage, production build, SonarQube, Docker build, and Docker push.
- `Jenkinsfile`: root/global pipeline if you want one combined deploy flow from the repository root.

## Kubernetes Commands

Apply manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-deployment.yaml
```

Check resources:

```bash
kubectl get all -n forme-education
```

Rollout commands:

```bash
kubectl rollout restart deployment/userservice -n forme-education
kubectl rollout status deployment/userservice -n forme-education
```

## Tests And Coverage

Backend:

```bash
cd "/vagrant/forme-microservices (1)/microservices/user-service"
mvn test
```

JaCoCo report output:

```text
target/site/jacoco/
target/site/jacoco/jacoco.xml
```

Frontend:

```bash
cd /vagrant/FormeFront
npm test -- --watch=false --code-coverage
```

Frontend coverage output:

```text
FormeFront/coverage/
```

## Monitoring

- Prometheus collects metrics from the cluster and the `userservice` actuator endpoint.
- Grafana displays dashboards using Prometheus as its datasource.
- Grafana datasource points to the in-cluster Prometheus service URL:

```text
http://prometheus-service.forme-education.svc.cluster.local:9090
```

## Current Status

Done so far:

- Vagrant VM
- Jenkins
- Docker
- `userservice` Docker image
- Kubernetes namespace `forme-education`
- MySQL and `userservice` in the same namespace
- Prometheus and Grafana deployed
- Frontend and backend CI pipeline files present

## Remaining Improvements

- Add more tests for higher coverage
- Add full Kubernetes deployment for frontend, `api-gateway`, and `eureka-server` if required by the group
- Grafana dashboard import may still be manual

## Future Repository Split

Teacher recommendation for the final organization:

- Frontend and backend should become separate Git repositories
- Frontend repository should own its own CI pipeline
- Backend repository should own its own CI pipeline
- One centralized CD pipeline should deploy shared Kubernetes manifests globally
