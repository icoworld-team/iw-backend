pipeline {
    agent any
    stages {
        stage('backend master Build') {
            steps {
                sh 'cp /var/icoworld/.env .'
                echo "Start database............"
                sh 'docker-compose up -d db'
                echo "Export env"
                sh 'export BUILD_ID=${BUILD_ID}'
                echo "Build backend services with build number - ${env.BUILD_ID}........"
                echo "Build backend services........"
                sh 'docker-compose build --no-cache app backend-1 backend-2'
                echo "Shut down backend-1 and restart with new image"
                sh 'docker-compose stop backend-1'
                sh 'docker-compose up -d --force-recreate backend-1'
                echo "Waiting 10 seconds..."
                sh 'sleep 10'
                echo "Shut down backend-2 and restart with new image"
                sh 'docker-compose stop backend-2'
                sh 'docker-compose up -d --force-recreate backend-2'
                echo "Start nginx proxy........."
                sh 'docker-compose up -d proxy'
                echo "FINISHED........"
            }
        }
    }
}

