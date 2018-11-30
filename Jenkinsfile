pipeline {
  agent any
  stages {
    stage('Copy environment') {
      steps {
        sh 'cp /var/icoworld/.env-fork ./.env'
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
        sh 'docker-compose up -d db || echo "The container name "/database" is already in use"'
      }
    }

    stage('Build') {
      steps {
        sh 'docker-compose build --no-cache app 1>/var/jenkins/buildlog/build-number_$BUILD_ID.txt'
      }
    }
    
    stage('Testing image ico/backend:${BUILD_ID}') {
      steps {
        sh('''#!/bin/bash
          docker run --name backend-test-$BUILD_ID -d -p 5555:3000 --network=efk_fluentd --env-file /var/icoworld/test.env ico/backend:$BUILD_ID && \\
          sleep 30 && \\
          RESPONSE=`curl localhost:5555` || exit 2
          if [ \$RESPONSE != 'icoWorld' ]; then
            echo "stopping container - ${BUILD_ID}"
            docker ps -f name=backend-test -q | xargs -r docker container stop
            echo "renaming container - ${BUILD_ID}"
            docker rename backend-test-$BUILD_ID backend-test-$BUILD_ID_fail
            echo "backend did not answer"
            exit 1
          else
            echo "stopping container - ${BUILD_ID}"
            docker stop backend-test-$BUILD_ID
            echo "removing container - ${BUILD_ID}"
            docker rm backend-test-$BUILD_ID
          fi
          ''')
      }
    }

    stage('Deploy') {
      steps {
        sh('''#!/bin/bash
          docker rm -f backend && \\
          docker-compose stop app && \\
          docker-compose up -d --force-recreate app
          ''')
      }
    }
  }
}
