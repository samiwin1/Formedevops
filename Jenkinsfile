pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
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

        stage('Environment Check') {
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            echo "Checking CI tools..."
                            java -version
                            mvn -version
                            node --version
                            npm --version
                            google-chrome --version || chromium-browser --version || chromium --version || true
                        '''
                    } else {
                        bat '''
                            echo Checking CI tools...
                            java -version
                            mvn -version
                            node --version
                            npm --version
                            where chrome || where chrome.exe || exit /b 0
                        '''
                    }
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir("${BACKEND_USER_SERVICE_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'mvn -B test'
                        } else {
                            bat 'mvn -B test'
                        }
                    }
                }
            }
        }

        stage('Backend Build') {
            steps {
                dir("${BACKEND_USER_SERVICE_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'mvn -B -DskipTests package'
                        } else {
                            bat 'mvn -B -DskipTests package'
                        }
                    }
                }
            }
        }

        stage('Frontend Install') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npm ci'
                        } else {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npx ng test --watch=false --browsers=ChromeHeadless --code-coverage'
                        } else {
                            bat 'npx ng test --watch=false --browsers=ChromeHeadless --code-coverage'
                        }
                    }
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('SonarQube Backend') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    dir('forme-microservices (1)/microservices/user-service') {
                        bat """
                        mvn sonar:sonar ^
                          -Dsonar.host.url=http://localhost:9000 ^
                          -Dsonar.token=%SONAR_TOKEN%
                        """
                    }
                }
            }
        }

        stage('SonarQube Frontend') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    dir('FormeFront') {
                        bat """
                        npx sonar-scanner ^
                          -Dsonar.host.url=http://localhost:9000 ^
                          -Dsonar.login=%SONAR_TOKEN%
                        """
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
