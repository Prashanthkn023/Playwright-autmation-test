
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
                bat 'if not exist allure-results mkdir allure-results'
            }
        }

        stage('Execute Tests') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'gctp-cms-credentials',
                        usernameVariable: 'CMS_USERNAME',
                        passwordVariable: 'CMS_PASSWORD'
                    ),
                    string(
                        credentialsId: 'GROQ_API_KEY',
                        variable: 'GROQ_API_KEY'
                    )
                ]) {
                    bat 'if not defined CMS_USERNAME (echo CMS_USERNAME is missing from Jenkins credentials & exit /b 1)'
                    bat 'if not defined CMS_PASSWORD (echo CMS_PASSWORD is missing from Jenkins credentials & exit /b 1)'
                    catchError(
                        buildResult: 'UNSTABLE',
                        stageResult: 'UNSTABLE'
                    ) {
                        bat 'npx playwright test --grep-invert "@manual"'
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
                artifacts: 'allure-results/**/*,bug-reports/**/*,tests/bug-reports/**/*,test-results/**/*,playwright-report/**/*',
                allowEmptyArchive: true,
                fingerprint: true
            )
        }
    }
}
