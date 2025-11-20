import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import transporter from '../../../lib/config/nodemailer.transporter';

import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import database from '../../../lib/config/prisma.client';

import { SendEmailVerificationSchema } from './send.email.validation';

export const SendEmailVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = await SendEmailVerificationSchema.validate(req.body, {
      abortEarly: false,
    });

    // Check if email already exists and verified
    const existingUser = await database.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        is_verified: true,
        first_name: true,
        last_name: true,
      },
    });

    if (existingUser && existingUser.is_verified) {
      throw new CustomError(
        HttpRes.status.CONFLICT,
        HttpRes.message.CONFLICT,
        'Email already registered and verified. Please login.',
      );
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Expiry in 15 minutes for email verification
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    // convert to Locale for casting
    const expireTimeStamp = verificationExpiry.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Store or update email verification data
    await database.emailVerification.upsert({
      where: { email },
      update: {
        verification_code: verificationCode,
        verification_token: verificationToken,
        expires_at: verificationExpiry,
        is_used: false,
        used_at: null,
      },
      create: {
        email,
        verification_code: verificationCode,
        verification_token: verificationToken,
        expires_at: verificationExpiry,
        is_used: false,
        used_at: null,
      },
    });

    // Create verification link ( NEED TO CHANGE )
    // const verificationLink = `http://localhost:8000/verify-email?verification_token=${verificationToken}`;
    const verificationLink = `${process.env.ACTIVATION_ACCOUNT_URL}?verification_token=${verificationToken}`;

    // Generate timestamp
    const currentTimestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send email verification
    const templateHtmlDir = path.resolve(__dirname, '../../../lib/template');
    const templateHtmlFile = 'account.activation.html';
    const templateHtmlPath = path.join(templateHtmlDir, templateHtmlFile);

    const templateHtml = fs.readFileSync(templateHtmlPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateHtml);

    const htmlToSend = compiledTemplate({
      email: email,
      verification_code: verificationCode,
      verification_link: verificationLink,
      expire_minutes: 15,
      expire_timestamp: expireTimeStamp,
      email_timestamp: currentTimestamp,
      current_year: new Date().getFullYear(),
    });

    await transporter.sendMail({
      from: 'Staysia <admin@gmail.com>',
      to: email,
      subject: 'Email Verification - staysia.id',
      html: htmlToSend,
    });

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success(
        'Verification code sent to your email. Please check your inbox.',
        {
          email: email,
          expiresIn: '15 minutes',
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
