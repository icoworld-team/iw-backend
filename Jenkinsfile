pipeline {
  agent any
  stages {
    stage('Copy environment') {
      steps {
        sh 'cp /var/icoworld/.env .'
      }
    }

    stage('Set BUILD_ID') {
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

    stage('Build number - ${BUILD_ID}') {
      steps {
        sh 'docker-compose build --no-cache app backend-1 backend-2'
      }
    
    stage('Testing image ico/backend:${BUILD_ID}') {
      steps {
        sh('''#!/bin/bash
          docker run -d -p 5555:3000 ico/backend:$BUILD_ID && \\
          RESPONSE=`curl localhost:5555` || exit 2
          if [ \$RESPONSE != 'icoWorld' ]; then
            docker stop ico/backend:$BUILD_ID
            docker rm ico/backend:$BUILD_ID
            echo "backend did not answer"
            exit 1
          else
            docker stop ico/backend:$BUILD_ID
            docker rm ico/backend:$BUILD_ID
          fi
          ''')
      }
    }

    stage('Deploy') {
      steps {
        sh('''#!/bin/bash
          docker-compose stop backend-1 && \\
          docker-compose up -d --force-recreate backend-1 && \\
          sleep 10 && \\
          docker-compose stop backend-2 && \\
          docker-compose up -d --force-recreate backend-2
          ''')
      }
    }

    stage('Start proxy') {
      steps {
        sh 'docker-compose up -d proxy'
        echo "FINISHED"
      }
    }
  }
}
