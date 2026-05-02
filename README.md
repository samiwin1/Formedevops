# ForME DevOps CI Setup

Simple Vagrant and Jenkins setup for the ForME student DevOps project.

## Start the CI VM

```bash
vagrant up
```

Connect to the VM:

```bash
vagrant ssh
```

Jenkins is available at:

```text
http://localhost:8081
```

To get the initial Jenkins admin password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

## Jenkins Pipelines

Create two Jenkins Pipeline jobs:

```text
Jenkinsfile-user-service
Jenkinsfile-frontend
```

Add Docker Hub credentials in Jenkins:

```text
ID: docker-hub
Type: Username with password
Username: your Docker Hub username
Password: your Docker Hub password or token
```

The pipeline stages are:

```text
Checkout -> Build -> Test -> Docker Build -> Docker Push
```

## User Service Image

The backend Dockerfile is:

```text
forme-microservices (1)/microservices/user-service/Dockerfile
```

The Jenkins pipeline builds and pushes:

```text
samiwin/user-service:latest
```

## Frontend Image

The Angular Dockerfile is:

```text
FormeFront/Dockerfile
```

The Jenkins pipeline builds and pushes:

```text
samiwin/frontend:latest
```
