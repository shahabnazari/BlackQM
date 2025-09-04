import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    // For development, use ethereal email (fake SMTP service)
    // In production, replace with real SMTP settings
    if (this.configService.get('NODE_ENV') === 'development') {
      // Use test account for development
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test',
        },
      });
    } else {
      // Production configuration
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: this.configService.get('SMTP_PORT', 587),
        secure: this.configService.get('SMTP_SECURE', false),
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: this.configService.get('EMAIL_FROM', 'noreply@vqmethod.com'),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || this.stripHtml(options.html),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      
      // In development, log the preview URL
      if (this.configService.get('NODE_ENV') === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #007aff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your VQMethod account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <div class="footer">
                <p>© 2025 VQMethod. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'VQMethod - Password Reset Request',
      html,
    });
  }

  async sendEmailVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/auth/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #48c774 0%, #00d1b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #48c774; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <p>Welcome to VQMethod!</p>
              <p>Please verify your email address to complete your registration and access all features.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verifyUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${verifyUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with VQMethod, please ignore this email.</p>
              <div class="footer">
                <p>© 2025 VQMethod. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'VQMethod - Verify Your Email Address',
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .feature { margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #007aff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to VQMethod!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for joining VQMethod, the advanced Q Methodology research platform.</p>
              
              <div class="features">
                <h3>What you can do with VQMethod:</h3>
                <div class="feature">✅ Create and manage Q methodology studies</div>
                <div class="feature">✅ Design custom Q-sorts with drag-and-drop interface</div>
                <div class="feature">✅ Collect participant responses with our intuitive interface</div>
                <div class="feature">✅ Analyze results with advanced statistical tools</div>
                <div class="feature">✅ Export data in multiple formats</div>
              </div>

              <p>Ready to create your first study?</p>
              <a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/researcher/dashboard" class="button">Go to Dashboard</a>
              
              <p>Need help getting started? Check out our documentation or contact support.</p>
              
              <div class="footer">
                <p>© 2025 VQMethod. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to VQMethod!',
      html,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}