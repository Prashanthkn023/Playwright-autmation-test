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

                bat 'npx playwright test'

            }

        }

        stage('Publish Report') {

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

}