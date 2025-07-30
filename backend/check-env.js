require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('================================');

console.log('📧 Email Configuration:');
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Not set');
console.log('SMTP_FROM:', process.env.SMTP_FROM || '❌ Not set');

console.log('\n🌐 Frontend Configuration:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Not set');

console.log('\n🔐 Authentication Configuration:');
console.log('ENABLE_LOCAL_AUTH:', process.env.ENABLE_LOCAL_AUTH || '❌ Not set');

console.log('\n📊 Email Service Status:');
const EmailService = require('./emailService');
const emailService = new EmailService();
console.log('Email Service Configured:', emailService.isConfigured ? '✅ Yes' : '❌ No');

console.log('\n🧪 Test Email Service:');
emailService.testEmailConfiguration().then(result => {
  console.log('Test Result:', result);
}).catch(error => {
  console.log('Test Error:', error.message);
}); 