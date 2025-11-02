import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import transporter from '../../../../lib/config/nodemailer.transporter';

interface SendPropertyUploadFailedEmailParams {
  email: string;
  errorMessage: string;
}

export const sendPropertyUploadFailedEmail = async ({
  email,
  errorMessage,
}: SendPropertyUploadFailedEmailParams) => {
  try {
    // Generate timestamp
    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Read and compile template
    const templateHtmlDir = path.resolve(__dirname, '../../../../lib/template');
    const templateHtmlFile = 'upload.property.failed.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateHtml);

    const htmlToSend = compiledTemplate({
      email: email,
      error_message: errorMessage,
      email_timestamp: currentTimestamp,
      current_year: new Date().getFullYear(),
    });

    // Send email
    await transporter.sendMail({
      from: 'Staysia <admin@gmail.com>',
      to: email,
      subject: 'Property Upload Failed - staysia.id',
      html: htmlToSend,
    });

    console.log(`Property upload failed email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send property upload failed email:', error);
    // Don't throw error to avoid breaking the main flow
  }
};
