import { test } from '@playwright/test';

export const ALLOW_PRODUCTION_SUBMISSIONS = process.env.ALLOW_PRODUCTION_SUBMISSIONS === 'true';

export function enforceProductionSafety(testName: string, isAuthenticationDependent: boolean = false) {
  if (isAuthenticationDependent && !ALLOW_PRODUCTION_SUBMISSIONS) {
    test.skip(true, `[Production Safety] Skipping '${testName}' because it attempts live authentication against production without explicit allow flag.`);
  }
}
