import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import FreelancerProfile from './models/FreelancerProfile.js';
import User from './models/User.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runComprehensiveVerification = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('===============================================================');
  console.log('🔍 WORKHIVE MODULE 2: COMPREHENSIVE VERIFICATION SUITE');
  console.log('===============================================================\n');

  await connectDB();

  const results = {
    passed: [],
    failed: [],
  };

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${title} ${details ? `(${details})` : ''}`);
      results.passed.push(title);
    } else {
      console.error(`❌ FAIL: ${title} ${details ? `(${details})` : ''}`);
      results.failed.push(title);
    }
  };

  // --- Step 1: Authentication ---
  console.log('--- 1. Authenticating Users ---');
  const fLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const fData = await fLogin.json();
  const fToken = fData.token;
  assert(fLogin.status === 200 && fToken, 'Freelancer login succeeded', fData.user?.email);

  const cLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const cData = await cLogin.json();
  const cToken = cData.token;
  assert(cLogin.status === 200 && cToken, 'Client login succeeded', cData.user?.email);

  // --- Step 2: Unauthenticated / Role Guard Verification ---
  console.log('\n--- 2. Role-Based Access Control Verification ---');
  const unauthRes = await fetch(`${baseUrl}/profiles/me`);
  assert(unauthRes.status === 401, 'Unauthenticated access to /api/profiles/me blocked with 401');

  const clientCreateRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      fullName: 'Client Impersonator',
      professionalTitle: 'Fake',
      bio: 'Should be rejected',
      skills: ['React'],
      hourlyRate: 50,
    }),
  });
  assert(clientCreateRes.status === 403, 'Client role blocked from POST /api/profiles with 403 Forbidden');

  const clientUpdateRes = await fetch(`${baseUrl}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({ hourlyRate: 99 }),
  });
  assert(clientUpdateRes.status === 403, 'Client role blocked from PUT /api/profiles/me with 403 Forbidden');

  // --- Step 3: Profile Creation & Validation Checks ---
  console.log('\n--- 3. Profile Creation & Input Validation ---');

  // 3a. Validation: Invalid portfolio URL
  const invalidUrlRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      fullName: 'Dana Sterling',
      professionalTitle: 'Developer',
      bio: 'Bio details',
      skills: ['React'],
      hourlyRate: 50,
      portfolioLinks: ['not-a-valid-url'],
    }),
  });
  assert(invalidUrlRes.status === 400, 'Invalid portfolio URL rejected with 400 Bad Request');

  // 3b. Validation: Missing required skills
  const missingSkillsRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      fullName: 'Dana Sterling',
      professionalTitle: 'Developer',
      bio: 'Bio details',
      skills: [],
      hourlyRate: 50,
    }),
  });
  assert(missingSkillsRes.status === 400, 'Empty skills array rejected with 400 Bad Request');

  // 3c. Valid Profile Creation
  const createRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      fullName: 'Dana Sterling',
      professionalTitle: 'Senior Full Stack MERN Architect',
      bio: 'Experienced full stack engineer building responsive React frontends, high-throughput Node.js microservices, and MongoDB Atlas databases.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'TypeScript', 'TailwindCSS'],
      experienceLevel: 'Expert',
      education: 'Master of Science in Computer Science',
      collegeName: 'Stanford University',
      hourlyRate: 85,
      location: 'San Francisco, CA (Remote)',
      portfolioLinks: ['https://danasterling.io', 'https://github.com/dana-workhive/project-demo'],
      githubLink: 'https://github.com/dana-workhive',
      linkedinLink: 'https://linkedin.com/in/dana-sterling',
    }),
  });
  const createData = await createRes.json();
  const profileId = createData.data?._id;
  assert(createRes.status === 201 && profileId, 'Valid profile created successfully', `ID: ${profileId}`);

  // --- Step 4: Reading Profile (GET /api/profiles/me) ---
  console.log('\n--- 4. Reading Profile (GET /api/profiles/me) ---');
  const meRes = await fetch(`${baseUrl}/profiles/me`, {
    headers: { Authorization: `Bearer ${fToken}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, 'GET /api/profiles/me returned 200 OK');
  assert(meData.data?.professionalTitle === 'Senior Full Stack MERN Architect', 'Professional title retrieved correctly');
  assert(meData.data?.hourlyRate === 85, 'Hourly rate ($85) retrieved correctly');
  assert(Array.isArray(meData.data?.skills) && meData.data?.skills.includes('React'), 'Skills array preserved correctly');
  assert(meData.data?.portfolioLinks?.length === 2, 'Portfolio links (2 items) retrieved correctly');
  assert(meData.data?.collegeName === 'Stanford University', 'College name retrieved correctly');

  // --- Step 5: Updating Profile (PUT /api/profiles/me) ---
  console.log('\n--- 5. Updating Profile (PUT /api/profiles/me) ---');
  const updateRes = await fetch(`${baseUrl}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      hourlyRate: 95,
      skills: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'TypeScript', 'TailwindCSS', 'GraphQL', 'Next.js'],
      bio: 'Updated bio: Specializing in high-performance Web3 & enterprise SaaS applications.',
      location: 'Austin, TX (Remote)',
      education: 'Ph.D. in Distributed Systems',
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, 'PUT /api/profiles/me returned 200 OK');
  assert(updateData.data?.hourlyRate === 95, 'Updated hourly rate ($95) persisted');
  assert(updateData.data?.skills?.length === 8, 'Updated skills count (8) persisted');
  assert(updateData.data?.location === 'Austin, TX (Remote)', 'Updated location persisted');
  assert(updateData.data?.education === 'Ph.D. in Distributed Systems', 'Updated education persisted');

  // --- Step 6: Find Talent Directory (GET /api/profiles) ---
  console.log('\n--- 6. Find Talent Directory & Filtering (GET /api/profiles) ---');
  const allProfilesRes = await fetch(`${baseUrl}/profiles`);
  const allProfilesData = await allProfilesRes.json();
  assert(allProfilesRes.status === 200, 'GET /api/profiles public directory returned 200 OK');
  assert(Array.isArray(allProfilesData.data) && allProfilesData.data.length > 0, 'Find Talent returns at least 1 freelancer profile', `Count: ${allProfilesData.count}`);

  // Test skill filtering
  const skillFilterRes = await fetch(`${baseUrl}/profiles?skill=React`);
  const skillFilterData = await skillFilterRes.json();
  assert(skillFilterRes.status === 200 && skillFilterData.data.length > 0, 'Filter by skill (?skill=React) returns matching profiles');

  // Test search filtering
  const searchFilterRes = await fetch(`${baseUrl}/profiles?search=Sterling`);
  const searchFilterData = await searchFilterRes.json();
  assert(searchFilterRes.status === 200 && searchFilterData.data.length > 0, 'Search keyword (?search=Sterling) matches freelancer name');

  // --- Step 7: Public Freelancer Profile Page API (GET /api/profiles/:id) ---
  console.log('\n--- 7. Public Freelancer Profile Page API (GET /api/profiles/:id) ---');
  // 7a. Unauthenticated guest access to public profile
  const guestPublicRes = await fetch(`${baseUrl}/profiles/${profileId}`);
  const guestPublicData = await guestPublicRes.json();
  assert(guestPublicRes.status === 200, 'Unauthenticated guest can load public profile page data');
  assert(guestPublicData.data?.fullName === 'Dana Sterling', 'Public profile returns correct freelancer name');
  assert(guestPublicData.data?.userId?.email !== undefined, 'User relationship populated correctly');

  // 7b. Client access to public profile
  const clientPublicRes = await fetch(`${baseUrl}/profiles/${profileId}`, {
    headers: { Authorization: `Bearer ${cToken}` },
  });
  assert(clientPublicRes.status === 200, 'Authenticated Client can load public profile page data');

  // 7c. Access by userId instead of profileId
  const userId = fData.user._id;
  const userParamRes = await fetch(`${baseUrl}/profiles/${userId}`);
  assert(userParamRes.status === 200, 'Profile accessible by userId parameter (/api/profiles/:userId)');

  // 7d. Non-existent ObjectId returns 404
  const fakeId = new mongoose.Types.ObjectId().toString();
  const notFoundRes = await fetch(`${baseUrl}/profiles/${fakeId}`);
  assert(notFoundRes.status === 404, 'Non-existent profile ID returns 404 Not Found');

  // 7e. Invalid ObjectId format returns 400
  const malformedRes = await fetch(`${baseUrl}/profiles/invalid-id-format`);
  assert(malformedRes.status === 400, 'Malformed profile ID returns 400 Bad Request');

  // --- Step 8: MongoDB Persistence Verification ---
  console.log('\n--- 8. Direct MongoDB Atlas Persistence Verification ---');
  const dbDoc = await FreelancerProfile.findById(profileId);
  assert(dbDoc !== null, 'Profile document exists directly in MongoDB Atlas collection "freelancerprofiles"');
  assert(dbDoc.hourlyRate === 95, 'MongoDB Atlas verified: hourlyRate is exactly 95');
  assert(dbDoc.skills.includes('GraphQL'), 'MongoDB Atlas verified: skills includes GraphQL');
  assert(dbDoc.portfolioLinks.length === 2, 'MongoDB Atlas verified: 2 portfolio links stored');
  assert(dbDoc.githubLink === 'https://github.com/dana-workhive', 'MongoDB Atlas verified: GitHub link stored');
  assert(dbDoc.linkedinLink === 'https://linkedin.com/in/dana-sterling', 'MongoDB Atlas verified: LinkedIn link stored');
  assert(typeof dbDoc.rating === 'number' && dbDoc.rating >= 1, 'MongoDB Atlas verified: default rating field is populated');

  console.log('\n===============================================================');
  console.log(`📊 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('===============================================================');

  await mongoose.disconnect();

  if (results.failed.length > 0) {
    process.exit(1);
  }
};

runComprehensiveVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});

