"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTenantVerifiedEmail = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const Handlebars = __importStar(require("handlebars"));
const nodemailer_transporter_1 = __importDefault(require("../../../lib/config/nodemailer.transporter"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const sendTenantVerifiedEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, userId, tenantProfileId, }) {
    try {
        // Get tenant profile details with user info
        const tenantProfile = yield prisma_client_1.default.tenantProfile.findUnique({
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
        yield nodemailer_transporter_1.default.sendMail({
            from: 'Staysia <admin@gmail.com>',
            to: email,
            subject: 'Tenant Verification Successful - staysia.id',
            html: htmlToSend,
        });
    }
    catch (error) {
        console.error('Failed to send tenant verification success email:', error);
        // Don't throw error to avoid breaking the main flow
    }
});
exports.sendTenantVerifiedEmail = sendTenantVerifiedEmail;
