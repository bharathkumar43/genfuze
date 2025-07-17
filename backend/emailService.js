const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Get email configuration from environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Check if email is configured
    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service configured');
    } else {
      console.log('⚠️  Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
    }
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
}

module.exports = EmailService; 