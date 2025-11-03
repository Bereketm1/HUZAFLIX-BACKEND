pipeline {
  agent none // We'll define agent per stage

  environment {
    PNPM_HOME = '/root/.local/share/pnpm'
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
  }

  stages {

    stage('Checkout Code') {
      agent any
      steps {
        git branch: 'develop',
            url: 'git@gitlab.com:huzalabs-products/huzaflix-backend.git',
            credentialsId: 'github-ssh-backend'
      }
    }

    stage('Install Dependencies') {
      agent {
        docker {
          image 'node:20'
          reuseNode true // Reuse the same workspace/node
        }
      }
      steps {
        sh '''
          corepack enable
          corepack prepare pnpm@latest --activate
          pnpm install --frozen-lockfile
        '''
      }
    }

    stage('Lint & Test') {
      agent {
        docker {
          image 'node:20'
          reuseNode true
        }
      }
      steps {
        sh '''
          pnpm all:lint
          pnpm all:test
        '''
      }
    }

    stage('Build All Services') {
      agent any
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE build"
      }
    }

    stage('Stop Containers') {
      when {
        expression { currentBuild.currentResult == 'SUCCESS' }
      }
      agent any
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE down"
      }
    }

    stage('Deploy Containers') {
      when {
        expression { currentBuild.currentResult == 'SUCCESS' }
      }
      agent any
      steps {
        sh "docker-compose -f $DOCKER_COMPOSE_FILE up -d"
      }
    }

  }

  post {
    success { echo 'Deployment successful' }
    failure { echo 'Deployment failed, containers unchanged' }
  }
}
