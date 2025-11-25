import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { getEmailConfig } from './email.config';
import { emailConfigs } from './template.email';

// Email Template Configuration Types
const templatePath = path.resolve(__dirname, '..', 'templates', 'emailTemplate.hbs');
/**
 * * template:
 *   - Đọc file HBS template và compile bằng handlebars
 *   - Dùng để render HTML email từ config đã chuẩn bị
 */
/**
 * template:
 *   - Đọc file HBS template và compile bằng handlebars
 *   - Dùng để render HTML email từ config đã chuẩn bị
 */
const source = fs.readFileSync(templatePath, 'utf8');
const template = handlebars.compile(source);

/**
 * Renders the email template using Handlebars and the EmailConfig structure.
 * @param type The type of email (e.g., 'verify-email', 'reset-password')
 * @param token Optional token for actionUrl
 * @param customData Optional custom data for dynamic fields (e.g., userName, userIp, timestamp)
 * @returns Rendered HTML email string
 */
export function renderEmailTemplate(type: string, token?: string, customData?: Record<string, any>): string {
  /**
   * * renderEmailTemplate:
   *   - Hàm chính để render ra HTML email hoàn chỉnh
   *   - Truyền vào loại email (type), token (nếu cần), customData (nếu có)
   *   - Kết hợp config và template để trả về HTML cuối cùng
   *   - Sử dụng cho các hàm gửi email trong service
   */
  /**
   * * renderEmailTemplate:
   *   - Hàm chính để render ra HTML email hoàn chỉnh
   *   - Truyền vào loại email (type), token (nếu cần), customData (nếu có)
   *   - Kết hợp config và template để trả về HTML cuối cùng
   *   - Sử dụng cho các hàm gửi email trong service
   */
  const config = getEmailConfig(type as keyof typeof emailConfigs, token, customData);
  return template(config);
}
