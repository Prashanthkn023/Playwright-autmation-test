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

                bat 'npm ci'

            }

        }

        stage('Install Browsers') {

            steps {

                bat 'npx playwright install chromium'

            }

        }

        stage('Clean Reports') {

            steps {

                bat 'if exist allure-results rmdir /s /q allure-results'
                bat 'if exist allure-report rmdir /s /q allure-report'
                bat 'if exist playwright-report rmdir /s /q playwright-report'
                bat 'if exist test-results rmdir /s /q test-results'
                bat 'mkdir allure-results'

            }

        }

        stage('Execute Tests') {

            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'gctp-cms-credentials',
                        usernameVariable: 'Prashanth@gtcp.in',
                        passwordVariable: 'Prashnath@123'
                    )
                ]) {

                    catchError(
                        buildResult: 'UNSTABLE',
                        stageResult: 'UNSTABLE'
                    ) {

                        bat 'npx playwright test'

                    }

                }

            }

        }

        stage('Publish Allure Report') {

            steps {

                allure([
                    includeProperties: false,
                    jdk: '',
                    results: [[path: 'allure-results']]
                ])

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
                artifacts: 'allure-results/**/*,bug-reports/**/*,test-results/**/*,playwright-report/**/*',
                allowEmptyArchive: true,
                fingerprint: true
            )

        }

    }

}
