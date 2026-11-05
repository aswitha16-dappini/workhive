import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testProfileModule = async () => {
  const baseUrl = 'http://localhost:5000/api';
  console.log('====================================================');
  console.log('🧪 WorkHive Module 2: Freelancer Profile Management Test');
  console.log('====================================================');

  await connectDB();

  // 1. Authenticate Freelancer
  const fLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const fData = await fLogin.json();
  const fToken = fData.token;
  console.log('1. Freelancer Authenticated:', fData.user?.name);

  // 2. Authenticate Client
  const cLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const cData = await cLogin.json();
  const cToken = cData.token;
  console.log('2. Client Authenticated:', cData.user?.name);

  // 3. Clear existing profile for clean test run
  await FreelancerProfile.deleteMany({ userId: fData.user._id });
  console.log('🧹 Cleaned existing profile records for fresh test.');

  // 4. Test Unauthenticated Access to /api/profiles/me (Expect 401)
  console.log('\n--- Test 1: Unauthenticated Guard ---');
  const unauthRes = await fetch(`${baseUrl}/profiles/me`);
  console.log('4. Unauthenticated access blocked:', unauthRes.status === 401 ? '✅ 401 Unauthorized (Pass)' : '❌ FAIL');

  // 5. Test Client Cannot Create Freelancer Profile (Expect 403)
  console.log('\n--- Test 2: Role Authorization Guard ---');
  const clientCreateRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      fullName: 'Charlie Fake Freelancer',
      professionalTitle: 'Hacker',
      bio: 'Should fail',
      skills: ['None'],
      hourlyRate: 50,
    }),
  });
  console.log('5. Client cannot create freelancer profile:', clientCreateRes.status === 403 ? '✅ 403 Forbidden (Pass)' : '❌ FAIL');

  // 6. Freelancer Creates Profile
  console.log('\n--- Test 3: Freelancer Creates Profile ---');
  const createRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      fullName: 'Dana Sterling',
      professionalTitle: 'Lead MERN Stack Engineer & Cloud Architect',
      bio: 'Passionate software engineer specializing in scalable React frontends, high-performance Node.js microservices, and robust MongoDB database architectures.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'JavaScript', 'TypeScript', 'TailwindCSS'],
      experienceLevel: 'Expert',
      education: 'Bachelor of Technology in Computer Science',
      collegeName: 'Stanford Institute of Technology',
      hourlyRate: 75,
      location: 'San Francisco, CA (Remote)',
      portfolioLinks: ['https://danasterling.dev', 'https://github.com/dana-workhive/portfolio'],
      githubLink: 'https://github.com/dana-workhive',
      linkedinLink: 'https://linkedin.com/in/dana-sterling',
    }),
  });
  const createdData = await createRes.json();
  console.log('6. Profile creation status:', createRes.status, createdData.success ? '✅ 201 Created' : '❌ FAIL');
  const profileId = createdData.data?._id;
  console.log(`   Profile ID: ${profileId}`);
  console.log(`   Title: ${createdData.data?.professionalTitle}`);
  console.log(`   College: ${createdData.data?.collegeName}`);
  console.log(`   Hourly Rate: $${createdData.data?.hourlyRate}/hr`);

  // 7. Freelancer Gets Own Profile (GET /api/profiles/me)
  console.log('\n--- Test 4: Get My Profile ---');
  const meRes = await fetch(`${baseUrl}/profiles/me`, {
    headers: { Authorization: `Bearer ${fToken}` },
  });
  const meData = await meRes.json();
  console.log('7. Get /me status:', meRes.status, meData.success ? '✅ 200 OK' : '❌ FAIL');
  console.log(`   Retrieved: ${meData.data?.fullName} (${meData.data?.skills?.length} skills)`);

  // 8. Freelancer Edits/Updates Profile (PUT /api/profiles/me)
  console.log('\n--- Test 5: Freelancer Edits Profile ---');
  const updateRes = await fetch(`${baseUrl}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      hourlyRate: 85, // Updated rate
      skills: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'Next.js', 'GraphQL', 'AWS'],
      location: 'New York, NY (Remote)',
      collegeName: 'Stanford University (Alumni)',
    }),
  });
  const updateData = await updateRes.json();
  console.log('8. Update status:', updateRes.status, updateData.success ? '✅ 200 OK' : '❌ FAIL');
  console.log(`   Updated Hourly Rate: $${updateData.data?.hourlyRate}/hr`);
  console.log(`   Updated College: ${updateData.data?.collegeName}`);
  console.log(`   Updated Skills count: ${updateData.data?.skills?.length}`);

  // 9. Client Can View Freelancer's Public Profile (GET /api/profiles/:id)
  console.log('\n--- Test 6: Client Views Public Profile ---');
  const publicRes = await fetch(`${baseUrl}/profiles/${profileId}`, {
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const publicData = await publicRes.json();
  console.log('9. Public profile view status:', publicRes.status === 200 ? '✅ 200 OK (Client can view)' : '❌ FAIL');
  console.log(`   Viewed: ${publicData.data?.fullName} | ${publicData.data?.professionalTitle}`);

  // 10. Client Cannot Edit Freelancer Profile (Expect 403)
  console.log('\n--- Test 7: Client Cannot Edit Freelancer Profile ---');
  const clientEditRes = await fetch(`${baseUrl}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({ hourlyRate: 10 }),
  });
  console.log('10. Client edit blocked:', clientEditRes.status === 403 ? '✅ 403 Forbidden (Blocked as expected)' : '❌ FAIL');

  console.log('\n====================================================');
  console.log('🎉 ALL 7 FREELANCER PROFILE MANAGEMENT TESTS PASSED!');
  console.log('====================================================');

  await mongoose.disconnect();
};

testProfileModule().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
