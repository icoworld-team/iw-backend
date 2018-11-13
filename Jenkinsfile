pipeline {
  agent any
  stages {
    stage('Copy environment') {
      steps {
        sh 'cp /var/icoworld/.env-fork ./.env'
      }
    }

    stage('Set env vars') {
      steps {
        sh 'export BUILD_ID=${BUILD_ID}'
      }
    }

    stage('Start database') {
      steps{
        echo "Starting db..."
        sh 'docker-compose up -d db'
      }
    }

    stage('Build') {
      steps {
        sh 'docker-compose build --no-cache app'
      }
    }

    stage('Deploy') {
      steps {
        sh 'docker-compose up -d --force-recreate app'
      }
    }
  }
}
