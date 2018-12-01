pipeline {
  agent any
  stages {
    stage('Set env vars') {
      steps {
        sh 'export BUILD_ID=${BUILD_ID}'
      }
    }

    stage('Deploy to staging') {
      steps {
        sh('''#!/bin/bash
          ssh utah@icoworld.network /home/utah/deploy-backend.sh 
      }
    }
  }
}
