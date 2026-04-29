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
            when {
                expression {
                    return env.SONAR_TOKEN?.trim() && env.SONAR_HOST_URL?.trim()
                }
            }
            steps {
                dir("${BACKEND_USER_SERVICE_DIR}") {
                    script {
                        if (isUnix()) {
                            sh '''
                                mvn -B sonar:sonar \
                                  -Dsonar.host.url="$SONAR_HOST_URL" \
                                  -Dsonar.token="$SONAR_TOKEN"
                            '''
                        } else {
                            bat 'mvn -B sonar:sonar -Dsonar.host.url="%SONAR_HOST_URL%" -Dsonar.token="%SONAR_TOKEN%"'
                        }
                    }
                }
            }
        }

        stage('SonarQube Frontend') {
            when {
                expression {
                    return env.SONAR_TOKEN?.trim() && env.SONAR_HOST_URL?.trim()
                }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        if (isUnix()) {
                            sh '''
                                sonar-scanner \
                                  -Dsonar.host.url="$SONAR_HOST_URL" \
                                  -Dsonar.token="$SONAR_TOKEN"
                            '''
                        } else {
                            bat 'sonar-scanner -Dsonar.host.url="%SONAR_HOST_URL%" -Dsonar.token="%SONAR_TOKEN%"'
                        }
                    }
                }
            }
        }

        stage('SonarQube Placeholder') {
            when {
                expression {
                    return !(env.SONAR_TOKEN?.trim() && env.SONAR_HOST_URL?.trim())
                }
            }
            steps {
                echo 'SonarQube scan skipped.'
                echo 'Set SONAR_TOKEN and SONAR_HOST_URL in Jenkins credentials/environment to enable scans.'
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
