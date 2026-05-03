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
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    try {
                        withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                            dir('forme-microservices (1)/microservices/user-service') {
                                sh 'mvn sonar:sonar -Dsonar.projectKey=user-service -Dsonar.host.url=http://localhost:9000 -Dsonar.login=${SONAR_TOKEN}'
                            }
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
                    def kubeconfig = '/var/lib/jenkins/.kube/config'
                    def kubectlReady = sh(
                        script: "command -v kubectl >/dev/null 2>&1 && test -f ${kubeconfig} && kubectl --kubeconfig=${kubeconfig} cluster-info >/dev/null 2>&1",
                        returnStatus: true
                    ) == 0

                    if (kubectlReady) {
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/namespace.yaml"
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/mysql.yaml"
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/deployment.yaml"
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/service.yaml"
                        sh "kubectl --kubeconfig=${kubeconfig} rollout restart deployment/user-service -n pidev"
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/monitoring/prometheus-deployment.yaml"
                        sh "kubectl --kubeconfig=${kubeconfig} apply -f k8s/monitoring/grafana-deployment.yaml"
                    } else {
                        echo 'Kubernetes deploy skipped: kubectl is not installed or no cluster is configured.'
                    }
                }
            }
        }
    }
}
