/**
 * Test data for CMS Login Negative and Corner-Case tests
 * All inputs are designed to fail validation - no valid credentials
 */

export const CmsLoginTestData = {
  // =================================---------
  // MALFORMED EMAIL VALUES (NEG-LOGIN-04 to NEG-LOGIN-08)
  // ==========================================
  malformedEmails: {
    // Email without @ symbol
    noAtSymbol: 'invalidemail.com',
    // Email without domain
    noDomain: 'test@',
    // Email containing spaces
    withSpaces: 'test @invalid .com',
    // Email containing only spaces
    onlySpaces: '     ',
    // Unicode characters
    unicodeChars: '用户名@例子.广告',
    // HTML markup
    htmlMarkup: '<script>alert("xss")</script>@test.com',
    // SQL injection-like
    sqlInjection: "'; DROP TABLE users; --@test.com",
  },

  // ==========================================
  // LENGTH TEST VALUES (NEG-LOGIN-09, NEG-LOGIN-10)
  // ==========================================
  extremeLengths: {
    // Extremely long email (over 256 chars)
    longEmail: 'averylongemailaddressthatexceedsthemaximumallowabledomainlengthisnotvalid123456789012345678901234567890123456789012345678901234567890@test.com',
    // Extremely long password (over 100 chars)
    longPassword: 'ThisIsAVeryLongPasswordThatExceedsTheMaximumAllowedLengthForSecurityReasonsAndShouldNotBeAcceptedByTheSystem1234567890!@#$%^&*',
  },

  // ==========================================
  // SPECIAL CHARACTER VALUES (NEG-LOGIN-11)
  // ==========================================
  specialChars: {
    password: '!@#$%^&*()_+-=[]{}|;:,.<>?~`~!@#',
    // Mixed special characters
    mixedSpecial: 'P@ssw0rd!#$%^&*()',
  },

  // ==========================================
  // FORGOT PASSWORD TEST DATA (NEG-FP-*)
  // ==========================================
  forgotPasswordTestData: {
    // Empty email
    empty: '',
    // Malformed emails
    malformedEmails: [
      { id: 'NEG-FP-03', email: 'not-an-email', description: 'Email without @' },
      { id: 'NEG-FP-04', email: 'test@', description: 'Email without domain' },
      { id: 'NEG-FP-05', email: 'test @example.com', description: 'Email containing spaces' },
      { id: 'NEG-FP-07', email: '<script>alert(1)</script>@test.com', description: 'HTML markup in email' },
      { id: 'NEG-FP-08', email: "'; DROP TABLE users; --@test.com", description: 'SQL injection-like email' },
      { id: 'NEG-FP-09', email: '     ', description: 'Whitespace-only email' },
      { id: 'NEG-FP-10', email: '用户名@例子.广告', description: 'Unsupported Unicode email' },
    ],
  }
};

// Password test values
export const PasswordTestData = {
  // Whitespace-only password
  spacesOnly: '     ',
  // Password with special characters only
  specialOnly: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Empty values for testing
export const EmptyValues = {
  email: '',
  password: '',
};

export const WhitespaceValues = {
  email: '     ',
  password: '     ',
};

// QA-only test password (DO NOT use in production)
export const QA_TEST_PASSWORD = 'QaTestPassword123!@#';

// Test values for corner cases
export const CornerCaseTestData = {
  // Very short values
  singleChar: 'a',
  singleSpace: ' ',
  // Common injection patterns for testing
  injectionPatterns: [
    '" OR "1"="1',
    "' OR '1'='1",
    'admin\'--',
    '1; SELECT * FROM users',
  ],
};