const Database = require('./database');
const LocalAuthService = require('./localAuth');

async function createBharathUser() {
  const db = new Database();
  const localAuthService = new LocalAuthService();
  
  try {
    await db.connect();
    console.log('✅ Database connected');
    
    // Check if user already exists
    const existingUser = await db.getUserByEmail('bharathkumartummaganti@gmail.com');
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      return;
    }
    
    // Create user
    const userData = {
      id: 'user-bharath-' + Date.now(),
      email: 'bharathkumartummaganti@gmail.com',
      name: 'Bharath Kumar',
      password: await localAuthService.hashPassword('TestPassword123'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.createUser(userData);
    console.log('✅ User created successfully');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password: TestPassword123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

createBharathUser(); 