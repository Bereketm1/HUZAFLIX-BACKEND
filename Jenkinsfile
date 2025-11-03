pipeline {
  agent any

  environment {
    PNPM_HOME = '/root/.local/share/pnpm'
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
  }

  stages {

    stage('Checkout Code') {
      steps {
        git branch: 'develop',
            url: 'git@gitlab.com:huzalabs-products/huzaflix-backend.git',
            credentialsId: 'github-ssh-backend'
      }
    }

    stage('Install Dependencies') {
      steps {
        script {
          docker.image('node:20').inside {
            sh '''
              corepack enable
              corepack prepare pnpm@latest --activate
              pnpm install
            '''
          }
        }
      }
    }

    stage('Lint & Test') {
      steps {
        script {
          docker.image('node:20').inside {
            sh '''
              pnpm all:lint
              pnpm all:test
            '''
          }
        }
      }
    }

    stage('Build All Services') {
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE build"
      }
    }

    stage('Stop Containers') {
      when {
        expression { currentBuild.currentResult == 'SUCCESS' }
      }
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE down"
      }
    }

    stage('Deploy Containers') {
      when {
        expression { currentBuild.currentResult == 'SUCCESS' }
      }
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE up -d"
      }
    }

  }

  post {
    success { echo '✅ Deployment successful' }
    failure { echo '❌ Deployment failed, containers unchanged' }
  }
}
