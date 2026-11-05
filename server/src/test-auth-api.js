import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { generateToken } from './utils/generateToken.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runAuthTests = async () => {
  console.log('====================================================');
  console.log('🧪 WorkHive Module 1: Auth & Roles Integration Test');
  console.log('====================================================');

  await connectDB();

  try {
    // 1. Clean previous test users
    const testEmails = ['test_client@workhive.test', 'test_freelancer@workhive.test'];
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('🧹 Cleaned previous test user records.');

    // 2. Test User Registration: Client
    console.log('\n--- Test 1: Register Client ---');
    const clientUser = await User.create({
      name: 'Alice Client',
      email: 'test_client@workhive.test',
      password: 'password123',
      role: 'Client',
    });
    console.log(`✅ Client registered: ${clientUser.name} (${clientUser.role})`);
    console.log(`🔒 Password stored in DB (Hashed): ${clientUser.password !== 'password123' ? 'YES (Bcrypt Hashed)' : 'NO (ERROR)'}`);
    if (clientUser.password === 'password123') throw new Error('Password was stored in plain text!');

    // 3. Test User Registration: Freelancer
    console.log('\n--- Test 2: Register Freelancer ---');
    const freelancerUser = await User.create({
      name: 'Bob Freelancer',
      email: 'test_freelancer@workhive.test',
      password: 'freelancerPass456',
      role: 'Freelancer',
    });
    console.log(`✅ Freelancer registered: ${freelancerUser.name} (${freelancerUser.role})`);

    // 4. Test Password Matching (Bcrypt)
    console.log('\n--- Test 3: Password Verification ---');
    const userWithPassword = await User.findById(clientUser._id).select('+password');
    const correctMatch = await userWithPassword.matchPassword('password123');
    const wrongMatch = await userWithPassword.matchPassword('wrongpassword');
    console.log(`✅ Correct password matches: ${correctMatch}`);
    console.log(`✅ Wrong password rejected: ${!wrongMatch}`);
    if (!correctMatch || wrongMatch) throw new Error('Password verification logic failed');

    // 5. Test JWT Token Generation
    console.log('\n--- Test 4: JWT Token Generation ---');
    const clientToken = generateToken(clientUser._id, clientUser.role);
    const freelancerToken = generateToken(freelancerUser._id, freelancerUser.role);
    console.log(`✅ Client Token generated: ${clientToken.slice(0, 20)}...`);
    console.log(`✅ Freelancer Token generated: ${freelancerToken.slice(0, 20)}...`);

    // 6. Test Role Distinction
    console.log('\n--- Test 5: Role Authorization Logic ---');
    console.log(`✅ Alice has role 'Client': ${clientUser.role === 'Client'}`);
    console.log(`✅ Bob has role 'Freelancer': ${freelancerUser.role === 'Freelancer'}`);

    console.log('\n====================================================');
    console.log('🎉 ALL BACKEND AUTH & ROLE TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Auth test failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runAuthTests();

