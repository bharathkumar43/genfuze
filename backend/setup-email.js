const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 Email Configuration Setup for Genfuze.ai\n');
console.log('This script will help you configure email settings for password reset functionality.\n');

async function setupEmail() {
  try {
    // Read current .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    console.log('🔧 Email Configuration Options:\n');
    console.log('1. Gmail SMTP (Recommended for testing)');
    console.log('2. SendGrid (Recommended for production)');
    console.log('3. Skip email setup (continue with test mode)\n');

    const choice = await question('Choose an option (1-3): ');

    if (choice === '1') {
      await setupGmail(envContent, envPath);
    } else if (choice === '2') {
      await setupSendGrid(envContent, envPath);
    } else if (choice === '3') {
      console.log('✅ Email setup skipped. Password reset will continue in test mode.');
      console.log('📧 Emails will be logged to console instead of being sent.');
    } else {
      console.log('❌ Invalid choice. Please run the script again.');
    }

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

async function setupGmail(envContent, envPath) {
  console.log('\n📧 Gmail SMTP Setup\n');
  console.log('Before proceeding, make sure you have:');
  console.log('1. Enabled 2-Factor Authentication on your Gmail account');
  console.log('2. Generated an App Password from Google Account settings');
  console.log('   - Go to: https://myaccount.google.com/security');
  console.log('   - Click "2-Step Verification" → "App passwords"');
  console.log('   - Generate a password for "Mail"\n');

  const gmailAddress = await question('Enter your Gmail address: ');
  const appPassword = await question('Enter your Gmail App Password (16 characters): ');

  if (!gmailAddress || !appPassword) {
    console.log('❌ Gmail address and App Password are required.');
    return;
  }

  // Update .env content
  const emailConfig = `
# Email Configuration - Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${gmailAddress}
SMTP_PASS=${appPassword}
SMTP_FROM=${gmailAddress}
`;

  // Remove existing email config and add new one
  const updatedContent = removeExistingEmailConfig(envContent) + emailConfig;
  
  // Write updated .env file
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('\n✅ Gmail email configuration updated!');
  console.log('📧 Password reset emails will now be sent to users.');
  console.log('\n🔄 Please restart your server for changes to take effect.');
}

async function setupSendGrid(envContent, envPath) {
  console.log('\n📧 SendGrid Setup\n');
  console.log('Before proceeding, make sure you have:');
  console.log('1. Created a SendGrid account at https://sendgrid.com/');
  console.log('2. Verified your sender email address');
  console.log('3. Generated an API key\n');

  const apiKey = await question('Enter your SendGrid API Key: ');
  const fromEmail = await question('Enter your verified sender email: ');

  if (!apiKey || !fromEmail) {
    console.log('❌ API Key and sender email are required.');
    return;
  }

  // Update .env content
  const emailConfig = `
# Email Configuration - SendGrid
SENDGRID_API_KEY=${apiKey}
SMTP_FROM=${fromEmail}
`;

  // Remove existing email config and add new one
  const updatedContent = removeExistingEmailConfig(envContent) + emailConfig;
  
  // Write updated .env file
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('\n✅ SendGrid email configuration updated!');
  console.log('📧 Password reset emails will now be sent to users.');
  console.log('\n🔄 Please restart your server for changes to take effect.');
}

function removeExistingEmailConfig(content) {
  // Remove existing email-related lines
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('SMTP_') && 
           !trimmed.startsWith('SENDGRID_') && 
           !trimmed.includes('Email Configuration');
  });
  return filteredLines.join('\n');
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Run the setup
setupEmail(); 