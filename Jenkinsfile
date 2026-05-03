pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'samiwin/user-service:latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('forme-microservices (1)/microservices/user-service') {
                    sh 'mvn package -DskipTests'
                }
            }
        }

        stage('Test') {
            steps {
                dir('forme-microservices (1)/microservices/user-service') {
                    sh 'mvn test'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    try {
                        dir('forme-microservices (1)/microservices/user-service') {
                            sh 'mvn sonar:sonar -Dsonar.projectKey=user-service -Dsonar.host.url=http://10.0.2.15:9000 -Dsonar.login=sqa_98b386e6206eaeaef54e164839f214a4bd51dacc'
                        }
                    } catch (err) {
                        echo "SonarQube analysis skipped: ${err}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('forme-microservices (1)/microservices') {
                    sh 'docker build -t $DOCKER_IMAGE -f user-service/Dockerfile .'
                }
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker push $DOCKER_IMAGE'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def kubectlReady = sh(
                        script: 'command -v kubectl >/dev/null 2>&1 && kubectl cluster-info >/dev/null 2>&1',
                        returnStatus: true
                    ) == 0

                    if (kubectlReady) {
                        sh 'kubectl apply -f k8s/deployment.yaml'
                        sh 'kubectl apply -f k8s/service.yaml'
                    } else {
                        echo 'Kubernetes deploy skipped: kubectl is not installed or no cluster is configured.'
                    }
                }
            }
        }
    }
}
