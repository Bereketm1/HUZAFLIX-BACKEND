pipeline {
    agent any

    environment {
        APP_DIR = credentials('huzaflix-app-dir')
    }

    stages {

        stage('Checkout Code') {
            steps {
                dir(env.APP_DIR) {
                    script {
                        if (!fileExists('.git')) {
                            sh 'git clone -b develop git@gitlab.com:huzalabs-products/huzaflix-backend.git .'
                        } else {
                            sh 'git fetch --all'
                            sh 'git reset --hard origin/develop'
                        }
                    }
                }
            }
        }

        stage('Build All Services') {
            steps {
                dir(env.APP_DIR) {
                    sh 'docker-compose build'
                }
            }
        }

        stage('Stop Containers') {
            steps {
                dir(env.APP_DIR) {
                    sh 'docker-compose down || true'
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                dir(env.APP_DIR) {
                    sh 'docker-compose up -d'
                }
            }
        }

    }

    post {
        success {
            echo 'Deployment successful'
        }
        failure {
            echo 'Deployment failed, containers unchanged'
        }
    }
}
