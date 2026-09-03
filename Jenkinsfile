pipeline {

    agent any

    stages {

        stage('Checkout') {

            steps {

                checkout scm

            }

        }

        stage('Install Dependencies') {

            steps {

                bat 'npm install'

            }

        }

        stage('Install Browsers') {

            steps {

                bat 'npx playwright install'

            }

        }

        stage('Execute Tests') {

            steps {

                catchError(
                    buildResult: 'UNSTABLE',
                    stageResult: 'UNSTABLE'
                ) {

                    bat 'npx playwright test'

                }

            }

        }

        stage('Publish Playwright Report') {

            steps {

                publishHTML([
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Report'
                ])

            }

        }

    }

    post {

        always {

            archiveArtifacts(
                artifacts: 'bug-reports/**/*,test-results/**/*,playwright-report/**/*',
                allowEmptyArchive: true,
                fingerprint: true
            )

        }

    }

}
