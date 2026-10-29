import { TestAuditLogger } from './utils/testAuditLogger';

export default async function globalTeardown(): Promise<void> {
  console.log('===================================');
  console.log('Playwright Automation Completed');
  console.log('===================================');

  try {
    const summary = TestAuditLogger.getSummary();
    console.log('--- Test Audit Summary by Module ---');
    for (const [moduleName, stats] of Object.entries(summary.byModule)) {
      console.log(`${moduleName}: Total ${stats.total}, Pass ${stats.pass}, Fail ${stats.fail}, Error ${stats.error}`);
    }
    console.log('--- Test Audit Summary by Category ---');
    for (const [type, stats] of Object.entries(summary.byType)) {
      console.log(`[${type}] Total: ${stats.total}, Pass: ${stats.pass}, Fail: ${stats.fail}, Error: ${stats.error}`);
    }
    console.log(`Overall: Total ${summary.totalValidations}, Pass ${summary.passed}, Fail ${summary.failed}, Error ${summary.error}`);
    console.log('--------------------------------------');
  } catch (error) {
    console.error('Failed to generate Test Audit Summary:', error);
  }
}
