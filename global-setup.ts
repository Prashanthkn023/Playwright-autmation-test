import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    console.log('===================================');
    console.log('Automation Execution Started');
    console.log('===================================');
}

export default globalSetup;