// Email template & config for Twitter Clone
// This is the template I have uesed in all of my previos projects that needs Email functionality
//Can be customized with emailConfigs object below
//In your env file, make sure to set PROJECT_NAME variable
//BUT IN THIS PROJECT, WE WILL USE HANDLEBARS TEMPLATE INSTEAD
//IF YOU DON'T WANT TO USE HANDLEBARS (BECAUSE NEED TO INSTALL MORE DEPENDENCIES), YOU CAN USE THIS FILE
export const emailConfigs = {
  'verify-email': {
    title: 'Email Verification',
    heading: 'Verify Your Email Address',
    greeting: `Welcome to <strong>${process.env.PROJECT_NAME}</strong>! Let's connect the world together.`,
    message: 'To complete your registration, please verify your email address by clicking the button below.',
    buttonText: 'Verify Email',
    actionUrl: (token: string) => `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`,
    previewText: 'Verify your email address for your new account.',
    primaryColor: '#1da1f2',
    secondaryColor: '#0a8dff',
    logo: '',
    projectInitial: process.env.PROJECT_NAME ? process.env.PROJECT_NAME[0] : 'T',
    subheading: '',
    showButton: true,
    showCode: false,
    verificationCode: '',
    codeLabel: '',
    codeExpiry: '',
    showUrl: false,
    urlLabel: '',
    showWarning: true,
    warningIcon: '🔒',
    warningTitle: 'Security Notice:',
    warningMessage:
      'This verification link will expire in 5 minutes. If you did not create this account, please ignore this email.',
    warningBgColor: '#FEF3C7',
    warningBorderColor: '#F59E0B',
    warningTextColor: '#92400E',
    showAdditionalInfo: false,
    additionalInfo: '',
    showSocialLinks: false,
    socialLinks: [],
    contactText: '',
    companyAddress: '',
    showUnsubscribe: false,
    unsubscribeUrl: '',
    preferencesUrl: '',
    footerText: `You received this email because you registered for ${process.env.PROJECT_NAME}.<br>If you did not request this, you can safely ignore it.`
  },
  'reset-password': {
    title: 'Reset Password',
    heading: 'Reset Your Password',
    greeting: `Hello! We received a request to reset your <strong>${process.env.PROJECT_NAME}</strong> account password.`,
    message:
      'To reset your password, click the button below. If you did not request a password reset, you can ignore this email.',
    buttonText: 'Reset Password',
    actionUrl: (token: string) => `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`,
    previewText: 'Reset your password for your account.',
    primaryColor: '#1da1f2',
    secondaryColor: '#0a8dff',
    logo: '',
    projectInitial: process.env.PROJECT_NAME ? process.env.PROJECT_NAME[0] : 'T',
    subheading: '',
    showButton: true,
    showCode: false,
    verificationCode: '',
    codeLabel: '',
    codeExpiry: '',
    showUrl: false,
    urlLabel: '',
    showWarning: true,
    warningIcon: '⚠️',
    warningTitle: 'Important:',
    warningMessage:
      'This link is only valid for 1 hour. If you did not request a password reset, please ignore this email.',
    warningBgColor: '#FEE2E2',
    warningBorderColor: '#EF4444',
    warningTextColor: '#991B1B',
    showAdditionalInfo: false,
    additionalInfo: '',
    showSocialLinks: false,
    socialLinks: [],
    contactText: '',
    companyAddress: '',
    showUnsubscribe: false,
    unsubscribeUrl: '',
    preferencesUrl: '',
    footerText: `You received this email because a password reset was requested.<br>If you did not make this request, please contact us immediately.`
  }
};

// Function to get email configuration based on purpose
function getEmailConfig(purpose: keyof typeof emailConfigs) {
  if (!emailConfigs[purpose]) {
    throw new Error(`Invalid email purpose: ${purpose}. Valid options are: ${Object.keys(emailConfigs).join(', ')}`);
  }
  return emailConfigs[purpose];
}
// Function to generate email HTML template
// Can be customized as needed (especially if you don't like the current design)
const generateEmailTemplate = (token: string, purpose: keyof typeof emailConfigs) => {
  const config = getEmailConfig(purpose);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title} - ${process.env.PROJECT_NAME}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:linear-gradient(135deg,#1DA1F2 0%,#AAB8C2 100%);line-height:1.6;">
    <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
            <td align="center" style="padding:60px 20px;">
                <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.15);">
                    <tr>
                        <td style="padding:0;background:linear-gradient(135deg,#1DA1F2 0%,#AAB8C2 100%);">
                            <table role="presentation" style="width:100%;">
                                <tr>
                                    <td style="padding:48px 48px 56px;text-align:center;">
                                        <h2 style="margin:0 0 24px;font-family:'Segoe Script','Comic Sans MS',cursive;font-size:42px;font-weight:400;color:#fff;font-style:italic;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${process.env.PROJECT_NAME}</h2>
                                        <h1 style="margin:0;font-size:32px;font-weight:700;color:#fff;letter-spacing:-0.02em;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${config.heading}</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:56px 48px 48px;">
                            <p style="margin:0 0 28px;font-size:17px;color:#374151;line-height:1.7;">
                                ${config.greeting}
                            </p>
                            <p style="margin:0 0 32px;font-size:16px;color:#4b5563;line-height:1.7;">
                                ${config.message}
                            </p>
                            <table role="presentation" style="width:100%;border-collapse:collapse;margin:40px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${config.actionUrl(token)}"
                                           style="display:inline-block;padding:18px 56px;background:linear-gradient(135deg,#1DA1F2 0%,#657786 100%);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:17px;letter-spacing:0.02em;box-shadow:0 6px 20px rgba(29,161,242,0.35);transition:all 0.3s ease;">
                                            ${config.buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <div style="margin:40px 0 0;padding:24px;background-color:#F3F6F9;border-radius:10px;border-left:4px solid #1DA1F2;">
                                <p style="margin:0 0 12px;font-size:14px;color:#4b5563;font-weight:600;">
                                    Button not working?
                                </p>
                                <p style="margin:0 0 12px;font-size:14px;color:#6b7280;line-height:1.6;">
                                    Copy and paste this link into your browser:
                                </p>
                                <p style="margin:0;font-size:13px;color:#1DA1F2;word-break:break-all;font-family:'Courier New',monospace;background-color:#fff;padding:12px;border-radius:6px;">
                                    ${config.actionUrl(token)}
                                </p>
                            </div>
                            <div style="margin:32px 0 0;padding:20px;background-color:${config.warningBgColor};border-radius:10px;border-left:4px solid ${config.warningBorderColor};">
                                <p style="margin:0;font-size:14px;color:${config.warningTextColor};line-height:1.6;">
                                    <strong>${config.warningIcon} ${config.warningTitle}</strong> ${config.warningMessage}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 48px;background:linear-gradient(135deg,#F3F6F9 0%,#E8EDF2 100%);border-top:1px solid #D1D5DB;">
                            <p style="margin:0 0 20px;font-size:15px;color:#4b5563;text-align:center;line-height:1.6;">
                                Need help? Contact our team at<br>
                                <a href="mailto:${process.env.EMAIL_USERNAME || 'support@twitterclone.com'}" style="color:#1DA1F2;text-decoration:none;font-weight:600;">${process.env.EMAIL_USERNAME || 'support@twitterclone.com'}</a>
                            </p>
                            <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
                                © 2025 ${process.env.PROJECT_NAME} - Connect the World
                            </p>
                        </td>
                    </tr>
                </table>
                <table role="presentation" style="max-width:600px;width:100%;margin-top:32px;">
                    <tr>
                        <td style="text-align:center;padding:0 20px;">
                            <p style="margin:0;font-size:13px;color:#fff;line-height:1.6;text-shadow:0 1px 2px rgba(0,0,0,0.1);">
                                ${config.footerText}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

export { generateEmailTemplate, getEmailConfig };
