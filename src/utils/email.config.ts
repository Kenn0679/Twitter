/**
 **  EmailConfig:
 * -Định nghĩa tất cả các trường có thể dùng trong một email template.
 * - Các trường này sẽ được truyền vào file HBS để render ra HTML email.
 * - Có thể mở rộng thêm trường nếu muốn cá nhân hóa email.
 */
interface EmailConfig {
  title: string; // Tiêu đề email (hiển thị trên tab browser)
  projectName: string; // Tên đầy đủ dự án (dùng cho logo mặc định đẹp hơn)
  previewText: string; // Text preview khi xem email trong inbox
  heading: string; // Tiêu đề chính trong email
  subheading?: string; // Tiêu đề phụ (optional)
  logo?: string; // URL logo công ty
  projectInitial: string; // Chữ cái đầu project (fallback khi không có logo)
  primaryColor: string; // Màu chính (#1da1f2)
  secondaryColor: string; // Màu phụ (#0a8dff)
  greeting: string; // Lời chào ("Hi there! 👋")
  message: string; // Nội dung chính

  // Button configuration
  showButton: boolean; // Có hiển thị button không?
  buttonText?: string; // Text trên button ("Verify Email")
  actionUrl?: string; // URL khi click button

  // Verification code (cho 2FA, OTP...)
  showCode: boolean; // Hiển thị mã xác thực không?
  verificationCode?: string; // Mã xác thực (123456)
  codeLabel?: string; // Label cho code
  codeExpiry?: string; // Thời gian hết hạn

  // URL fallback
  showUrl: boolean; // Hiển thị link dự phòng không?
  urlLabel?: string; // Label cho link

  // Warning box
  showWarning: boolean; // Hiển thị hộp cảnh báo không?
  warningIcon?: string; // Icon ("⚠️", "🔒")
  warningTitle?: string; // Tiêu đề cảnh báo
  warningMessage?: string; // Nội dung cảnh báo
  warningBgColor?: string; // Màu nền (#FEE2E2)
  warningBorderColor?: string; // Màu viền
  warningTextColor?: string; // Màu chữ

  // Additional info
  showAdditionalInfo: boolean;
  additionalInfo?: string; // HTML content thêm (password tips, etc.)

  // Social links
  showSocialLinks: boolean;
  socialLinks?: Array<{ name: string; url: string; icon: string }>;

  // Footer
  contactText?: string; // Text liên hệ
  contactEmail: string; // Email support
  companyAddress?: string; // Địa chỉ công ty
  currentYear: number; // Năm hiện tại (2025)
  showUnsubscribe: boolean; // Hiển thị link unsubscribe
  unsubscribeUrl?: string;
  preferencesUrl?: string;
  footerText?: string; // Text cuối email
}

const getBaseConfig = (): Partial<EmailConfig> => ({
  /**
   * getBaseConfig:
   *   - Lấy các giá trị mặc định từ biến môi trường hoặc giá trị cứng.
   *   - Dùng cho các trường chung của mọi email (màu sắc, logo, tên dự án, ...)
   *   - Giúp dễ dàng đổi thông tin dự án mà không cần sửa từng config email.
   */
  logo: process.env.EMAIL_LOGO_URL || '',
  projectInitial: process.env.PROJECT_NAME,
  projectName: process.env.PROJECT_NAME || 'Twitter Clone',
  primaryColor: process.env.PRIMARY_COLOR || '#1da1f2',
  secondaryColor: process.env.SECONDARY_COLOR || '#0a8dff',
  contactEmail: process.env.CONTACT_EMAIL || 'support@example.com',
  companyAddress: process.env.COMPANY_ADDRESS || '',
  currentYear: new Date().getFullYear(),
  showButton: true,
  showCode: false,
  showUrl: true,
  showWarning: true,
  showAdditionalInfo: false,
  showSocialLinks: false,
  showUnsubscribe: false,
  urlLabel: '🔗 Or copy this link:',
  socialLinks: process.env.SOCIAL_LINKS ? JSON.parse(process.env.SOCIAL_LINKS) : []
});

// Helper function để tạo actionUrl
/**
 * * createActionUrl:
 *   - Tạo URL động cho các email cần xác thực, reset, ...
 *   - Nhận đường dẫn (path) và token, trả về URL dạng: BASE_URL/path?token=...
 *   - Giúp bảo mật và cá nhân hóa link cho từng user.
 */
export const createActionUrl = (path: string, token: string): string => {
  const baseUrl = process.env.FRONTEND_URL;
  return `${baseUrl}${path}?token=${token}`;
};

/**
 * !Phân tích kiểu cho emailConfigs:
 *
 * * a) Record<string, ...>
 *    - Key: 'verify-email', 'reset-password', ...
 *    - Value: Config object cho từng loại email
 *
 * * b) Omit<EmailConfig, 'actionUrl'>
 *    - Lấy tất cả fields của EmailConfig TRỪ actionUrl
 *    - Vì actionUrl cần xử lý đặc biệt (có thể là hàm hoặc chuỗi)
 *
 * * c) & { actionUrl?: string | ((token: string) => string) }
 *    - Thêm lại actionUrl nhưng cho phép 2 dạng:
 *      + Function: (token) => createUrl(token) - khi cần URL động
 *      + String: "https://fixed-url.com" - khi URL cố định
 *
 * TODO => Giúp linh hoạt cho từng loại email, vừa dùng được URL động (có token), vừa dùng được URL cố định.
 */
export const emailConfigs: Record<
  /**
   * * emailConfigs:
   *   - Chứa cấu hình cho từng loại email (xác thực, reset, ...)
   *   - Key là tên loại email, value là object config cho loại đó
   *   - Sử dụng Omit<EmailConfig, 'actionUrl'> để loại bỏ actionUrl khỏi type gốc
   *   - Thêm lại actionUrl với kiểu linh hoạt: string hoặc function nhận token
   *   - Giúp dễ mở rộng, thêm loại email mới chỉ cần thêm key và config tương ứng
   */
  string,
  Omit<EmailConfig, 'actionUrl'> & {
    actionUrl?: string | ((token: string) => string);
  }
> = {
  'verify-email': {
    projectInitial: getBaseConfig().projectInitial || 'T',
    projectName: getBaseConfig().projectName || 'Twitter Clone',
    primaryColor: getBaseConfig().primaryColor || '#1da1f2',
    secondaryColor: getBaseConfig().secondaryColor || '#0a8dff',
    contactEmail: getBaseConfig().contactEmail || 'support@example.com',
    companyAddress: getBaseConfig().companyAddress || '',
    currentYear: getBaseConfig().currentYear || new Date().getFullYear(),
    logo: getBaseConfig().logo,
    title: 'Verify Your Email',
    previewText: `Welcome to ${process.env.PROJECT_NAME || 'our platform'}! Verify your email to get started.`,
    heading: '🎉 Welcome Aboard!',
    subheading: "Let's verify your email address",
    greeting: `Hi there! 👋<br><br>Welcome to <strong>${process.env.PROJECT_NAME || 'our platform'}</strong>! We're excited to have you join our community.`,
    message: `To ensure the security of your account and unlock all features, please verify your email address by clicking the button below.<br><br>This helps us keep your account safe and ensures you receive important updates.`,
    showButton: true,
    buttonText: '✓ Verify My Email',
    actionUrl: (token: string) => createActionUrl('/verify-email', token),
    showCode: false,
    showUrl: true,
    urlLabel: '🔗 Button not working? Copy this link:',
    showWarning: true,
    warningIcon: '🔒',
    warningTitle: 'Security Notice',
    warningMessage:
      "This verification link will expire in 24 hours for your security. If you didn't create this account, please ignore this email.",
    warningBgColor: '#FEF3C7',
    warningBorderColor: '#F59E0B',
    warningTextColor: '#92400E',
    showAdditionalInfo: false,
    showSocialLinks: false,
    showUnsubscribe: false,
    contactText: 'Need help getting started?',
    footerText: `You're receiving this email because someone created an account with this email address.<br>If this wasn't you, no action is needed – the account won't be activated without verification.`
  },
  'reset-password': {
    projectInitial: getBaseConfig().projectInitial || 'T',
    projectName: getBaseConfig().projectName || 'Twitter Clone',
    primaryColor: getBaseConfig().primaryColor || '#1da1f2',
    secondaryColor: getBaseConfig().secondaryColor || '#0a8dff',
    contactEmail: getBaseConfig().contactEmail || 'support@example.com',
    companyAddress: getBaseConfig().companyAddress || '',
    currentYear: getBaseConfig().currentYear || new Date().getFullYear(),
    logo: getBaseConfig().logo,
    title: 'Reset Your Password',
    previewText: `Password reset requested for your ${process.env.PROJECT_NAME || 'account'}.`,
    heading: '🔑 Reset Password',
    subheading: 'Secure your account with a new password',
    greeting: `Hello!<br><br>We received a request to reset the password for your <strong>${process.env.PROJECT_NAME || 'account'}</strong>.`,
    message: `If you requested this password reset, click the button below to create a new password. If you didn't make this request, you can safely ignore this email – your password will remain unchanged.`,
    showButton: true,
    buttonText: '🔐 Reset Password',
    actionUrl: (token: string) => createActionUrl('/reset-password', token),
    showCode: false,
    showUrl: true,
    urlLabel: '🔗 Button not working? Copy this link:',
    showWarning: true,
    warningIcon: '⚠️',
    warningTitle: 'Important Security Information',
    warningMessage:
      "This link expires in 1 hour. If you didn't request a password reset, someone may be trying to access your account. Please contact us immediately.",
    warningBgColor: '#FEE2E2',
    warningBorderColor: '#EF4444',
    warningTextColor: '#991B1B',
    showAdditionalInfo: true,
    additionalInfo: `
      <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">Password Tips:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#6b7280;line-height:1.8;">
        <li>Use at least 8 characters</li>
        <li>Mix uppercase and lowercase letters</li>
        <li>Include numbers and special characters</li>
        <li>Avoid common words or patterns</li>
      </ul>
    `,
    showSocialLinks: false,
    showUnsubscribe: false,
    contactText: 'Concerned about your account security?',
    footerText: `This password reset was requested from IP: <strong>{{userIp}}</strong> at {{timestamp}}.<br>If you didn't make this request, please secure your account immediately.`
  }
};

export function getEmailConfig(
  /**
   * * getEmailConfig:
   *   - Lấy config cho từng loại email (theo type: 'verify-email', 'reset-password', ...)
   *   - Nếu actionUrl là function thì sẽ truyền token vào để lấy URL động
   *   - Nếu có customData thì sẽ thay thế các biến động trong template (ví dụ: userIp, timestamp)
   *   - Trả về object đầy đủ các trường để render ra email
   */
  /**
   * * getEmailConfig:
   *   - Lấy config cho từng loại email (theo type: 'verify-email', 'reset-password', ...)
   *   - Nếu actionUrl là function thì sẽ truyền token vào để lấy URL động
   *   - Nếu có customData thì sẽ thay thế các biến động trong template (ví dụ: userIp, timestamp)
   *   - Trả về object đầy đủ các trường để render ra email
   */
  type: keyof typeof emailConfigs,
  token?: string,
  customData?: Record<string, any>
): EmailConfig {
  const configTemplate = emailConfigs[type];

  if (!configTemplate) {
    throw new Error(`Email configuration not found for type: ${type}`);
  }

  // Create a copy of the config
  const config: any = { ...configTemplate };

  // Resolve actionUrl if it's a function
  if (token && typeof config.actionUrl === 'function') {
    config.actionUrl = config.actionUrl(token);
  }

  // Replace template variables in strings
  if (customData) {
    const replaceInString = (str: string): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return customData[key] !== undefined ? String(customData[key]) : match;
      });
    };

    Object.keys(config).forEach((key) => {
      const value = config[key];
      if (typeof value === 'string') {
        config[key] = replaceInString(value);
      }
    });
  }

  return config as EmailConfig;
}
