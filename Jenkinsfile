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
        sh 'docker-compose up -d db'
      }
    }

    stage('Build') {
      steps {
        sh 'docker-compose build --no-cache app 1>/var/jenkins/buildlog/build-number_$BUILD_ID.txt'
      }
    }
    
    stage('Deploy') {
      steps {
        sh('''#!/bin/bash
          docker-compose stop app && \\
          docker-compose up -d --force-recreate app
          ''')
      }
    }
  }
}
