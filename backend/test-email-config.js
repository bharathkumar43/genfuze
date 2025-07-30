require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET (hidden)' : 'NOT SET');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
  console.log('');

  // Test SendGrid first
  if (process.env.SENDGRID_API_KEY) {
    console.log('🔍 Testing SendGrid configuration...');
    try {
      const sendgridConfig = {
        service: 'SendGrid',
        auth: {
          api_key: process.env.SENDGRID_API_KEY
        }
      };
      
      const transporter = nodemailer.createTransport(sendgridConfig);
      await transporter.verify();
      console.log('✅ SendGrid configuration is valid!');
      
      // Test sending
      const testEmail = {
        from: process.env.SMTP_FROM || 'test@example.com',
        to: 'test@example.com',
        subject: 'Test Email from Genfuze.ai',
        text: 'This is a test email to verify configuration.'
      };
      
      console.log('📧 Attempting to send test email...');
      const result = await transporter.sendMail(testEmail);
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      return;
      
    } catch (error) {
      console.log('❌ SendGrid test failed:', error.message);
    }
  }

  // Test SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('🔍 Testing SMTP configuration...');
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };
      
      console.log('📋 SMTP Config:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.auth.user
      });
      
      const transporter = nodemailer.createTransport(smtpConfig);
      await transporter.verify();
      console.log('✅ SMTP configuration is valid!');
      
      // Test sending
      const testEmail = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.SMTP_USER, // Send to yourself for testing
        subject: 'Test Email from Genfuze.ai',
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
        html: `
          <h2>Test Email from Genfuze.ai</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your email configuration is working!</p>
        `
      };
      
      console.log('📧 Attempting to send test email...');
      const result = await transporter.sendMail(testEmail);
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Check your email inbox for the test message.');
      
    } catch (error) {
      console.log('❌ SMTP test failed:', error.message);
      
      if (error.message.includes('Invalid login')) {
        console.log('\n💡 Common solutions:');
        console.log('1. Make sure you\'re using an App Password, not your regular password');
        console.log('2. Enable 2-Factor Authentication on your Gmail account');
        console.log('3. Generate a new App Password from Google Account settings');
      } else if (error.message.includes('Connection timeout')) {
        console.log('\n💡 Common solutions:');
        console.log('1. Check your internet connection');
        console.log('2. Verify the SMTP host and port are correct');
        console.log('3. Try a different port (587 or 465)');
      }
    }
  } else {
    console.log('❌ No email configuration found!');
    console.log('\n📖 To set up email:');
    console.log('1. Read the EMAIL_SETUP_GUIDE.md file');
    console.log('2. Update your .env file with email credentials');
    console.log('3. Run this test again');
  }
}

// Run the test
testEmailConfig().catch(console.error); 