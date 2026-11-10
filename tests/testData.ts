import path from 'path';

export const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'https://gctp.in',
  CMS_URL: process.env.CMS_URL || 'https://cms.gctp.in',
  FEEDBACK_URL: 'https://gctp.in/chennai-feedback',
  COMPLAINT_URL: 'https://gctp.in/chennai-complaints',
  CMS_MEDIA_URL: 'https://cms.gctp.in/chennai-media-Cms',
  CMS_NEWS_URL: 'https://cms.gctp.in/chennai-news-updates-Cms',
  SEARCH_URL: 'https://gctp.in/chennai-home',

  CREDENTIALS: {
    username: process.env.CMS_USERNAME || '',
    password: process.env.CMS_PASSWORD || '',
  },

  LIMITS: {
    mobileMinDigits: 10,
    mobileMaxDigits: 10,
    feedbackMaxLength: 100, // observed max length on feedback textarea
    complaintMaxUploadBytes: 5 * 1024 * 1024, // 5MB standard limit
    cmsNewsTitleMaxLength: 255, // standard default title limit
  },

  SELECTORS: {
    usernameInput: 'input[name="username"], input[type="email"], input[placeholder="example@gmail.com"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[type="submit"], input[type="submit"], button:has-text("Login")',
    feedbackMessage: 'textarea[name="message"], textarea',
    feedbackSubmit: 'button:has-text("Submit")',
    feedbackSuccess: 'text=Feedback submitted successfully!',
    complaintName: 'input[placeholder="Enter Your Name"]',
    complaintMobile: 'input[placeholder="Enter 10-digit mobile number"]',
    complaintMessage: 'textarea[placeholder="Type your message..."]',
    complaintUpload: 'input[type="file"]',
    complaintSubmit: 'button:has-text("Validate")',
    complaintSuccess: 'text=/Complaint submitted successfully|submitted successfully|success/i',
    searchBox: 'input[placeholder*="Search" i], input[type="text"]',
  },

  API_ENDPOINTS: {
    login: '/api/fusion-configuration-service/users/login',
    homePage: '/api/fusion-public-facing-web-backend/home-page',
    media: '/api/fusion-public-facing-web-backend/media',
    news: '/api/fusion-public-facing-web-backend/news-and-updates',
    citizenLogin: '/api/fusion-iccc-service/citizen/login',
  }
};

export function file(
  name: string,
  mimeType: string,
  bytes: number
) {
  return {
    name,
    mimeType,
    buffer: Buffer.alloc(bytes)
  };
}
