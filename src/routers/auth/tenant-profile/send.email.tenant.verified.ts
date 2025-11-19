import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import transporter from '../../../lib/config/nodemailer.transporter';
import database from '../../../lib/config/prisma.client';

interface SendTenantVerifiedEmailParams {
  email: string;
  userId: string;
  tenantProfileId: number;
}

export const sendTenantVerifiedEmail = async ({
  email,
  userId,
  tenantProfileId,
}: SendTenantVerifiedEmailParams) => {
  try {
    // Get tenant profile details with user info
    const tenantProfile = await database.tenantProfile.findUnique({
      where: { id: tenantProfileId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!tenantProfile) {
      throw new Error('Tenant profile not found');
    }

    // Generate timestamp
    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Format verified timestamp
    const verifiedAt = tenantProfile.verified_at
      ? new Date(tenantProfile.verified_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : currentTimestamp;

    // Read and compile template
    const templateHtmlDir = path.resolve(__dirname, '../../../lib/template');
    const templateHtmlFile = 'tenant.verified.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateHtml);

    const htmlToSend = compiledTemplate({
      email: email,
      contact: tenantProfile.contact,
      address: tenantProfile.address,
      city: tenantProfile.city,
      country: tenantProfile.country,
      government_id_type: tenantProfile.government_id_type,
      verified_at: verifiedAt,
      dashboard_link: `${process.env.DOMAIN_URL}/user`,
      email_timestamp: currentTimestamp,
      current_year: new Date().getFullYear(),
    });

    // Send email
    await transporter.sendMail({
      from: 'Staysia <admin@gmail.com>',
      to: email,
      subject: 'Tenant Verification Successful - staysia.id',
      html: htmlToSend,
    });
  } catch (error) {
    console.error('Failed to send tenant verification success email:', error);
    // Don't throw error to avoid breaking the main flow
  }
};
