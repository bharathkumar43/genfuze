const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter().catch(error => {
      console.error('❌ [EmailService] Failed to initialize transporter:', error);
    });
  }

  async initializeTransporter() {
    // For testing purposes, always configure a basic email service
    console.log('📧 [EmailService] Initializing email service...');
    
    // Check if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      const emailConfig = {
        service: 'SendGrid',
        auth: {
          api_key: process.env.SENDGRID_API_KEY
        }
      };
      
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ SendGrid email service configured');
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use SMTP
      const emailConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ SMTP email service configured');
      
      // Test the SMTP connection
      try {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified successfully');
      } catch (error) {
        console.log('⚠️ SMTP connection failed, falling back to test mode:', error.message);
        // Fallback to test mode
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log('📧 [TEST EMAIL] Would send email:');
            console.log('📧 [TEST EMAIL] To:', mailOptions.to);
            console.log('📧 [TEST EMAIL] Subject:', mailOptions.subject);
            console.log('📧 [TEST EMAIL] From:', mailOptions.from);
            console.log('📧 [TEST EMAIL] Reset Link:', mailOptions.html.includes('reset-password?token=') ? 'Found in email' : 'Not found');
            
            // Simulate successful email sending
            return { messageId: 'test-message-id-' + Date.now() };
          }
        };
        console.log('✅ Test email service configured (emails will be logged to console)');
      }
    } else {
      // For testing - create a mock transporter that logs emails
      console.log('🧪 [EmailService] No email service configured, using test mode');
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 [TEST EMAIL] Would send email:');
          console.log('📧 [TEST EMAIL] To:', mailOptions.to);
          console.log('📧 [TEST EMAIL] Subject:', mailOptions.subject);
          console.log('📧 [TEST EMAIL] From:', mailOptions.from);
          console.log('📧 [TEST EMAIL] Reset Link:', mailOptions.html.includes('reset-password?token=') ? 'Found in email' : 'Not found');
          
          // Simulate successful email sending
          return { messageId: 'test-message-id-' + Date.now() };
        }
      };
      this.isConfigured = true;
      console.log('✅ Test email service configured (emails will be logged to console)');
    }
  }

  generatePasswordResetEmailHTML(resetLink, userName) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Hello ${userName}, we received a request to reset your password for your Genfuze.ai account.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #666;">Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">🔐 Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #3B82F6; font-size: 14px; word-break: break-all;">${resetLink}</p>
          
          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Security Notice</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">• This link will expire in 1 hour</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">• If you didn't request this reset, please ignore this email</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">• Your password will remain unchanged until you click the link above</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
          <div style="margin-bottom: 10px;">
            <img src="https://genfuze.ai/logo.png" alt="Genfuze.ai" style="height: 40px; width: auto;" onerror="this.style.display='none'">
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">
            This email was sent from <strong>Genfuze.ai</strong>. If you have any questions, please contact our support team.
          </p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
            © 2024 Genfuze.ai - AI-Powered Content Analysis Platform
          </p>
        </div>
      </div>
    `;
  }

  generatePasswordResetEmailText(resetLink, userName) {
    return `
Password Reset Request - Genfuze.ai

Hello ${userName},

We received a request to reset your password for your Genfuze.ai account.

To reset your password, click the following link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you click the link above

This email was sent from Genfuze.ai. If you have any questions, please contact our support team.
    `;
  }

  async sendCrawlCompletionEmail(userEmail, crawlData) {
    if (!this.isConfigured) {
      console.log('Email service not configured, skipping email notification');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const {
        websiteUrl,
        totalPages,
        crawledPages,
        failedPages,
        skippedPages,
        totalContent,
        startTime,
        endTime,
        duration
      } = crawlData;

      const durationMinutes = Math.round(duration / 60000);
      const contentKB = Math.round(totalContent / 1024);

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: `Website Crawl Completed: ${websiteUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Website Crawl Completed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your website crawling job has finished successfully!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Crawl Summary</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                  <h3 style="margin: 0 0 5px 0; color: #28a745; font-size: 16px;">Website</h3>
                  <p style="margin: 0; color: #666; word-break: break-all;">${websiteUrl}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                  <h3 style="margin: 0 0 5px 0; color: #007bff; font-size: 16px;">Duration</h3>
                  <p style="margin: 0; color: #666;">${durationMinutes} minutes</p>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #28a745;">${crawledPages}</div>
                  <div style="font-size: 12px; color: #666;">Pages Crawled</div>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${failedPages}</div>
                  <div style="font-size: 12px; color: #666;">Pages Failed</div>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${skippedPages}</div>
                  <div style="font-size: 12px; color: #666;">Pages Skipped</div>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${contentKB} KB</div>
                  <div style="font-size: 12px; color: #666;">Content Size</div>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">Timing Details</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Started:</strong> ${new Date(startTime).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Completed:</strong> ${new Date(endTime).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Total Time:</strong> ${durationMinutes} minutes</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                This email was sent automatically by your LLM Q&A Automation Tool.
              </p>
            </div>
          </div>
        `,
        text: `
Website Crawl Completed: ${websiteUrl}

Crawl Summary:
- Website: ${websiteUrl}
- Duration: ${durationMinutes} minutes
- Pages Crawled: ${crawledPages}
- Pages Failed: ${failedPages}
- Pages Skipped: ${skippedPages}
- Content Size: ${contentKB} KB

Timing Details:
- Started: ${new Date(startTime).toLocaleString()}
- Completed: ${new Date(endTime).toLocaleString()}
- Total Time: ${durationMinutes} minutes

This email was sent automatically by your LLM Q&A Automation Tool.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Crawl completion email sent successfully');
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending crawl completion email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendErrorEmail(userEmail, errorData) {
    if (!this.isConfigured) {
      console.log('Email service not configured, skipping error email notification');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const {
        websiteUrl,
        error,
        startTime,
        endTime,
        crawledPages
      } = errorData;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: `Website Crawl Failed: ${websiteUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Website Crawl Failed</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your website crawling job encountered an error.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Error Details</h2>
              
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #dc3545;">Error Message</h3>
                <p style="margin: 0; color: #666; word-break: break-word;">${error}</p>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h3 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Website</h3>
                  <p style="margin: 0; color: #666; word-break: break-all;">${websiteUrl}</p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <h3 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">Pages Crawled</h3>
                  <p style="margin: 0; color: #666;">${crawledPages || 0}</p>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">Timing Details</h3>
                <p style="margin: 5px 0; color: #666;"><strong>Started:</strong> ${new Date(startTime).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Failed:</strong> ${new Date(endTime).toLocaleString()}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                This email was sent automatically by your LLM Q&A Automation Tool.
              </p>
            </div>
          </div>
        `,
        text: `
Website Crawl Failed: ${websiteUrl}

Error Details:
- Website: ${websiteUrl}
- Error: ${error}
- Pages Crawled: ${crawledPages || 0}

Timing Details:
- Started: ${new Date(startTime).toLocaleString()}
- Failed: ${new Date(endTime).toLocaleString()}

This email was sent automatically by your LLM Q&A Automation Tool.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Error email sent successfully');
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending error email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testEmailConfiguration() {
    if (!this.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.SMTP_USER, // Send to self for testing
        subject: 'Email Service Test - LLM Q&A Tool',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Email Service Test</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your email service is working correctly!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Test Details</h2>
              <p style="color: #666;">This is a test email to verify that your email service is properly configured and working.</p>
              <p style="color: #666;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
        text: `
Email Service Test - LLM Q&A Tool

This is a test email to verify that your email service is properly configured and working.

Timestamp: ${new Date().toLocaleString()}
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetLink, userName) {
    console.log('📧 [EmailService] sendPasswordResetEmail called with:', { userEmail, userName, hasResetLink: !!resetLink });
    console.log('📧 [EmailService] Email service configured:', this.isConfigured);
    
    if (!this.isConfigured) {
      console.log('❌ [EmailService] Email service not configured, skipping password reset email');
      return { success: false, error: 'Email service not configured' };
    }

    // Check if this is a test transporter (no real email service)
    if (this.transporter && typeof this.transporter.sendMail === 'function' && !this.transporter.transporter) {
      console.log('🧪 [EmailService] Using test mode - logging email to console');
      try {
        const mailOptions = {
          from: process.env.SMTP_FROM || 'noreply@genfuze.ai',
          to: userEmail,
          subject: '🔐 Password Reset Request - Genfuze.ai',
          html: this.generatePasswordResetEmailHTML(resetLink, userName),
          text: this.generatePasswordResetEmailText(resetLink, userName)
        };
        
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ [EmailService] Test email logged successfully');
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error('❌ [EmailService] Test email failed:', error);
        return { success: false, error: error.message };
      }
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: '🔐 Password Reset Request - Genfuze.ai',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Hello ${userName}, we received a request to reset your password for your Genfuze.ai account.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p style="color: #666;">Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">🔐 Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #3B82F6; font-size: 14px; word-break: break-all;">${resetLink}</p>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h3 style="margin: 0 0 10px 0; color: #856404;">Security Notice</h3>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">• This link will expire in 1 hour</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">• If you didn't request this reset, please ignore this email</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">• Your password will remain unchanged until you click the link above</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
              <div style="margin-bottom: 10px;">
                <img src="https://genfuze.ai/logo.png" alt="Genfuze.ai" style="height: 40px; width: auto;" onerror="this.style.display='none'">
              </div>
              <p style="margin: 0; color: #666; font-size: 14px;">
                This email was sent from <strong>Genfuze.ai</strong>. If you have any questions, please contact our support team.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                © 2024 Genfuze.ai - AI-Powered Content Analysis Platform
              </p>
            </div>
          </div>
        `,
        text: `
Password Reset Request - Genfuze.ai

Hello ${userName},

We received a request to reset your password for your Genfuze.ai account.

To reset your password, click the following link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you click the link above

This email was sent from Genfuze.ai. If you have any questions, please contact our support team.
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully');
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    if (!this.isConfigured) {
      console.log('Email service not configured, skipping welcome email');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: 'Welcome to Genfuze.ai! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Welcome aboard, ${userName}! 🎉</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Genfuze.ai account has been successfully created.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
              <h2 style="color: #333; margin-top: 0;">Welcome to Genfuze.ai</h2>
              <p style="color: #666;">Hi ${userName},</p>
              <p style="color: #666;">Thank you for joining Genfuze.ai! We're excited to have you on board and can't wait to help you unlock the full potential of AI-powered content analysis and question generation.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
                <h3 style="margin: 0 0 10px 0; color: #10B981;">What you can do with Genfuze.ai:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li>Generate intelligent questions from your content</li>
                  <li>Get AI-powered answers with high accuracy</li>
                  <li>Analyze content structure and SEO metrics</li>
                  <li>Track competitor performance and insights</li>
                  <li>Monitor AI visibility and optimization scores</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Get Started Now</a>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="margin: 0 0 10px 0; color: #1976d2;">Getting Started</h3>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">1. Log in to your account using your email and password</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">2. Start by analyzing your first piece of content</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">3. Generate questions and answers to enhance your content</p>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">4. Explore our advanced analytics and insights</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Welcome to the future of content optimization! 🚀<br>
                The Genfuze.ai Team
              </p>
            </div>
          </div>
        `,
        text: `
Welcome to Genfuze.ai! 🚀

Welcome aboard, ${userName}! 🎉

Your Genfuze.ai account has been successfully created.

What you can do with Genfuze.ai:
• Generate intelligent questions from your content
• Get AI-powered answers with high accuracy
• Analyze content structure and SEO metrics
• Track competitor performance and insights
• Monitor AI visibility and optimization scores

Getting Started:
1. Log in to your account using your email and password
2. Start by analyzing your first piece of content
3. Generate questions and answers to enhance your content
4. Explore our advanced analytics and insights

Get started now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Welcome to the future of content optimization! 🚀
The Genfuze.ai Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully');
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService; 