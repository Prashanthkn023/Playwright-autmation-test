import { TestAuditLogger } from './utils/testAuditLogger';

export default async function globalTeardown(): Promise<void> {
  console.log('===================================');
  console.log('Playwright Automation Completed');
  console.log('===================================');

  try {
    const summary = TestAuditLogger.getSummary();
    console.log('--- CmsTamilABT Test Audit Summary ---');
    console.log(`Total Validations : ${summary.totalValidations}`);
    console.log(`Passed Validations: ${summary.passed}`);
    console.log(`Failed Validations: ${summary.failed}`);
    console.log(`Error Validations : ${summary.error}`);
    for (const [type, stats] of Object.entries(summary.byType)) {
      console.log(`  [${type}] Total: ${stats.total}, Pass: ${stats.pass}, Fail: ${stats.fail}, Error: ${stats.error}`);
    }
    console.log('--------------------------------------');
  } catch (error) {
    console.error('Failed to generate Test Audit Summary:', error);
  }
}
