
pipeline {
    agent any

    environment {
        AI_PROVIDER = 'GROQ'
        EMAIL_RECIPIENTS = 'prashanthnagarajkn@gmail.com'
    }

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
                bat 'if exist bug-reports rmdir /s /q bug-reports'

                bat 'mkdir allure-results'
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

                    bat '''
                        if not defined CMS_USERNAME (
                            echo CMS_USERNAME is missing
                            exit /b 1
                        )

                        if not defined CMS_PASSWORD (
                            echo CMS_PASSWORD is missing
                            exit /b 1
                        )

                        if not defined GROQ_API_KEY (
                            echo GROQ_API_KEY is missing
                            exit /b 1
                        )
                    '''

                    catchError(
                        buildResult: 'FAILURE',
                        stageResult: 'FAILURE'
                    ) {
                        bat '''
                            npx playwright test --grep-invert "@manual" --workers=1
                        '''
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

            script {

                // Determine final Jenkins build status.
                def actualResult = currentBuild.currentResult

                def emailStatus = (
                    actualResult == 'SUCCESS'
                ) ? 'SUCCESS' : 'FAILED'

                env.EMAIL_STATUS = emailStatus

                echo '========================================'
                echo '       GCTP PLAYWRIGHT BUILD STATUS'
                echo '========================================'
                echo "Build Number : #${env.BUILD_NUMBER}"
                echo "Jenkins Result : ${actualResult}"
                echo "Email Status : ${emailStatus}"
                echo '========================================'

                // Archive all generated reports.
                archiveArtifacts(
                    artifacts: '''
                        allure-results/**/*,
                        bug-reports/**/*,
                        tests/bug-reports/**/*,
                        test-results/**/*,
                        playwright-report/**/*
                    ''',
                    allowEmptyArchive: true,
                    fingerprint: true
                )

                // Send email with dynamic SUCCESS / FAILED status.
                try {

                    emailext(
                        to: env.EMAIL_RECIPIENTS,

                        subject: "GCTP PLAYWRIGHT DAILY TEST REPORT - ${emailStatus} - BUILD #${env.BUILD_NUMBER}",

                        mimeType: 'text/plain',

                        attachmentsPattern: '''
                            bug-reports/Automation_Bug_Report_*.xlsx,
                            tests/bug-reports/Automation_Bug_Report_*.xlsx
                        ''',

                        body: """
GCTP PLAYWRIGHT DAILY TEST REPORT

Build Number: #${env.BUILD_NUMBER}

Status: ${emailStatus}

Jenkins Result: ${actualResult}

Jenkins Build:
${env.BUILD_URL}

Allure Report:
${env.BUILD_URL}allure/

Playwright Report:
${env.BUILD_URL}Playwright_20Report/

Excel Bug Report:
Attached (if generated)

AI Provider: GROQ

Regards,
GCTP Automation Team
"""
                    )

                    echo 'GCTP test report email sent successfully.'

                } catch (Exception e) {

                    echo "WARNING: Email delivery failed: ${e.getMessage()}"

                }
            }
        }
    }
}
