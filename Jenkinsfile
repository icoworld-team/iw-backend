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
                sh 'docker-compose build --no-cache app'
                echo "Shut down backend and restart with new image"
                sh 'docker ps -f name=backend -q | xargs -r docker container stop'
                sh 'docker-compose up -d app'
                echo "Waiting 10 seconds..."
                sh 'sleep 10'
                echo "FINISHED........"
            }
        }
    }
}

