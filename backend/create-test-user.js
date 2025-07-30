const Database = require('./database');
const LocalAuthService = require('./localAuth');

async function createTestUser() {
  const db = new Database();
  const localAuthService = new LocalAuthService();
  
  try {
    await db.connect();
    console.log('✅ Database connected');
    
    // Check if user already exists
    const existingUser = await db.getUserByEmail('joshithasri09@gmail.com');
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      return;
    }
    
    // Create test user
    const userData = {
      id: 'test-user-' + Date.now(),
      email: 'joshithasri09@gmail.com',
      name: 'Test User',
      password: await localAuthService.hashPassword('TestPassword123'),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.createUser(userData);
    console.log('✅ Test user created successfully');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Password: TestPassword123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await db.close();
  }
}

createTestUser(); 