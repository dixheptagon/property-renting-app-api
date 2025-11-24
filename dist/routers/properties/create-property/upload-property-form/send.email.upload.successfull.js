import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import transporter from '../../../../lib/config/nodemailer.transporter.js';
import database from '../../../../lib/config/prisma.client.js';
export const sendPropertyUploadSuccessEmail = async ({ email, propertyId, payload, }) => {
    try {
        // Get property details with tenant info
        const property = await database.property.findUnique({
            where: { id: propertyId },
            include: {
                tenant: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
        if (!property) {
            throw new Error('Property not found');
        }
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
        const templateHtmlFile = 'upload.property.succesfull.html';
        const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);
        const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
        const compiledTemplate = Handlebars.compile(templateHtml);
        // Get the minimum base price from the property base price
        let propertyRegularPrice = 0;
        if (payload.rooms && payload.rooms.length > 0) {
            const minBasePrice = Math.min(...payload.rooms.map((room) => room.base_price));
            propertyRegularPrice = minBasePrice;
        }
        const htmlToSend = compiledTemplate({
            email: email,
            property_uid: property.uid,
            property_title: property.title,
            property_category: property.category,
            property_address: property.address,
            property_city: property.city,
            property_country: property.country,
            property_postal_code: property.postal_code,
            property_base_price: Number(propertyRegularPrice || payload.rooms[0].base_price || 0).toLocaleString('id-ID'),
            dashboard_link: `${process.env.DOMAIN_URL}/dashboard/properties/${property.id}`,
            email_timestamp: currentTimestamp,
            current_year: new Date().getFullYear(),
        });
        // Send email
        await transporter.sendMail({
            from: 'Staysia <admin@gmail.com>',
            to: email,
            subject: 'Property Created Successfully - staysia.id',
            html: htmlToSend,
        });
    }
    catch (error) {
        console.error('Failed to send property upload success email:', error);
        // Don't throw error to avoid breaking the main flow
    }
};
