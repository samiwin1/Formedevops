pipeline {
    agent any

    tools {
        jdk 'jdk17'
        nodejs 'node20'
    }

    environment {
        BACKEND_USER_SERVICE_DIR = 'forme-microservices (1)/microservices/user-service'
        FRONTEND_DIR = 'FormeFront'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                dir(env.BACKEND_USER_SERVICE_DIR) {
                    sh 'mvn -B test'
                }
            }
        }

        stage('Backend Build') {
            steps {
                dir(env.BACKEND_USER_SERVICE_DIR) {
                    sh 'mvn -B -DskipTests package'
                }
            }
        }

        stage('Frontend Install') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh 'npx ng test --watch=false --browsers=ChromeHeadless --code-coverage'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube') {
            when {
                expression {
                    return env.SONAR_TOKEN?.trim() && env.SONAR_HOST_URL?.trim()
                }
            }
            parallel {
                stage('Backend SonarQube') {
                    steps {
                        dir(env.BACKEND_USER_SERVICE_DIR) {
                            sh '''
                                mvn -B sonar:sonar \
                                  -Dsonar.host.url="$SONAR_HOST_URL" \
                                  -Dsonar.token="$SONAR_TOKEN"
                            '''
                        }
                    }
                }

                stage('Frontend SonarQube') {
                    steps {
                        dir(env.FRONTEND_DIR) {
                            sh '''
                                sonar-scanner \
                                  -Dsonar.host.url="$SONAR_HOST_URL" \
                                  -Dsonar.token="$SONAR_TOKEN"
                            '''
                        }
                    }
                }
            }
        }

        stage('Summary') {
            steps {
                echo 'ForME Jenkins pipeline completed.'
                echo 'Backend module: User module / user-service'
                echo 'Frontend modules: Auth/User and Admin Dashboard'
                echo 'Docker, Kubernetes, Prometheus, and Grafana are intentionally not part of this pipeline yet.'
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: "${BACKEND_USER_SERVICE_DIR}/target/surefire-reports/*.xml"
            archiveArtifacts allowEmptyArchive: true, artifacts: "${BACKEND_USER_SERVICE_DIR}/target/*.jar, ${FRONTEND_DIR}/dist/**, ${FRONTEND_DIR}/coverage/**"
        }
        success {
            echo 'Pipeline succeeded.'
        }
        failure {
            echo 'Pipeline failed. Check the failing stage logs.'
        }
    }
}
