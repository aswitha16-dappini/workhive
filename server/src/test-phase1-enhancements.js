import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import ClientProfile from './models/ClientProfile.js';
import Project from './models/Project.js';
import Milestone from './models/Milestone.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runPhase1Tests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('===============================================================');
  console.log('🧪 WORKHIVE PHASE 1 ENHANCEMENTS: STATS, LASTLOGIN & CLIENT PROFILE');
  console.log('===============================================================\n');

  await connectDB();

  const results = { passed: [], failed: [] };
  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ PASS: ${title} ${details ? `(${details})` : ''}`);
      results.passed.push(title);
    } else {
      console.error(`❌ FAIL: ${title} ${details ? `(${details})` : ''}`);
      results.failed.push(title);
    }
  };

  // --- Test 1: User Login & lastLogin Update ---
  console.log('--- 1. Testing Login & lastLogin Timestamp Tracking ---');
  const cLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const cData = await cLogin.json();
  const cToken = cData.token;
  assert(cLogin.status === 200 && cToken, 'Client login successful', cData.user?.email);
  assert(cData.user?.lastLogin !== undefined, 'Login response includes lastLogin timestamp', cData.user?.lastLogin);

  const fLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const fData = await fLogin.json();
  const fToken = fData.token;
  assert(fLogin.status === 200 && fToken, 'Freelancer login successful', fData.user?.email);
  assert(fData.user?.lastLogin !== undefined, 'Freelancer lastLogin tracked', fData.user?.lastLogin);

  // --- Test 2: GET /api/stats (Live MongoDB Counts) ---
  console.log('\n--- 2. Testing Live Platform Stats API (GET /api/stats) ---');
  const statsRes = await fetch(`${baseUrl}/stats`);
  const statsData = await statsRes.json();
  assert(statsRes.status === 200, 'GET /api/stats returned 200 OK');

  const stats = statsData.data;
  assert(typeof stats.totalUsers === 'number' && stats.totalUsers >= 7, 'totalUsers is a dynamic number >= 7', `Actual: ${stats.totalUsers}`);
  assert(typeof stats.totalClients === 'number' && stats.totalClients >= 4, 'totalClients is a dynamic number >= 4', `Actual: ${stats.totalClients}`);
  assert(typeof stats.totalFreelancers === 'number' && stats.totalFreelancers >= 3, 'totalFreelancers is a dynamic number >= 3', `Actual: ${stats.totalFreelancers}`);
  assert(typeof stats.totalFreelancerProfiles === 'number' && stats.totalFreelancerProfiles >= 1, 'totalFreelancerProfiles dynamic count', `Actual: ${stats.totalFreelancerProfiles}`);
  assert(typeof stats.totalProjects === 'number' && stats.totalProjects >= 7, 'totalProjects dynamic count', `Actual: ${stats.totalProjects}`);
  assert(typeof stats.totalProposals === 'number' && stats.totalProposals >= 1, 'totalProposals dynamic count', `Actual: ${stats.totalProposals}`);
  assert(typeof stats.totalEscrowCompleted === 'number', 'totalEscrowCompleted calculated from actual released escrow records', `$${stats.totalEscrowCompleted}`);

  // --- Test 3: Client Profile Role-Based Access Control ---
  console.log('\n--- 3. Testing Client Profile Role Security ---');
  const unauthClientRes = await fetch(`${baseUrl}/client-profile/me`);
  assert(unauthClientRes.status === 401, 'Unauthenticated access to /api/client-profile/me blocked with 401 Unauthorized');

  const freelancerClientRes = await fetch(`${baseUrl}/client-profile/me`, {
    headers: { Authorization: `Bearer ${fToken}` }, // Freelancer attempting client profile
  });
  assert(freelancerClientRes.status === 403, 'Freelancer role blocked from /api/client-profile/me with 403 Forbidden');

  // --- Test 4: Client Profile GET /api/client-profile/me ---
  console.log('\n--- 4. Testing Client Profile Retrieval & Dynamic totalSpent ---');
  const myProfileRes = await fetch(`${baseUrl}/client-profile/me`, {
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const myProfileData = await myProfileRes.json();
  assert(myProfileRes.status === 200, 'GET /api/client-profile/me returned 200 OK');
  assert(myProfileData.data?.profile !== undefined, 'ClientProfile document loaded');
  assert(typeof myProfileData.data?.metrics?.totalSpent === 'number', 'totalSpent is dynamically computed from released milestone records', `$${myProfileData.data?.metrics?.totalSpent}`);
  assert(Array.isArray(myProfileData.data?.projects), 'Client posted projects loaded dynamically', `Projects: ${myProfileData.data?.projects?.length}`);

  // --- Test 5: Client Profile Input Validation (Website URL) ---
  console.log('\n--- 5. Testing Client Profile Validation ---');
  const invalidUrlRes = await fetch(`${baseUrl}/client-profile/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      companyWebsite: 'invalid-url-without-protocol',
    }),
  });
  assert(invalidUrlRes.status === 400, 'Invalid website URL without http/https rejected with 400 Bad Request');

  // --- Test 6: Client Profile Update & MongoDB Persistence ---
  console.log('\n--- 6. Testing Client Profile Save & MongoDB Persistence ---');
  const updateRes = await fetch(`${baseUrl}/client-profile/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      companyName: 'Apex Cloud Innovations Inc.',
      companyWebsite: 'https://apexcloud.dev',
      industry: 'Technology & Software',
      location: 'Austin, TX (Remote)',
      companyDescription: 'Leading venture-backed enterprise cloud provider building high-availability collaboration workspaces.',
      hiringRequirements: 'Seeking vetted senior React and Node.js developers for ongoing milestone deliverables.',
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, 'PUT /api/client-profile/me returned 200 OK');
  assert(updateData.data?.companyName === 'Apex Cloud Innovations Inc.', 'Company name persisted');
  assert(updateData.data?.companyWebsite === 'https://apexcloud.dev', 'Company website persisted');
  assert(updateData.data?.industry === 'Technology & Software', 'Industry persisted');

  // --- Test 7: Public Client Profile (GET /api/client-profile/:id) ---
  console.log('\n--- 7. Testing Public Client Profile Page API ---');
  const clientId = cData.user._id;
  const publicRes = await fetch(`${baseUrl}/client-profile/${clientId}`);
  const publicData = await publicRes.json();
  assert(publicRes.status === 200, 'Public client profile loaded successfully');
  assert(publicData.data?.profile?.companyName === 'Apex Cloud Innovations Inc.', 'Public profile displays verified company name');
  assert(Array.isArray(publicData.data?.openProjects), 'Public profile lists client open projects');

  // --- Test 8: Direct MongoDB Atlas Verification ---
  console.log('\n--- 8. Direct MongoDB Atlas Database Verification ---');
  const dbClientProfile = await ClientProfile.findOne({ userId: clientId });
  assert(dbClientProfile !== null, 'ClientProfile document exists directly in Atlas collection "clientprofiles"');
  assert(dbClientProfile.companyName === 'Apex Cloud Innovations Inc.', 'Atlas verified: companyName is Apex Cloud Innovations Inc.');
  assert(dbClientProfile.location === 'Austin, TX (Remote)', 'Atlas verified: location is Austin, TX (Remote)');

  const dbUser = await User.findById(clientId);
  assert(dbUser.lastLogin instanceof Date, 'Atlas verified: User.lastLogin is a valid Date timestamp');

  console.log('\n===============================================================');
  console.log(`📊 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('===============================================================');

  await mongoose.disconnect();
  if (results.failed.length > 0) process.exit(1);
};

runPhase1Tests().catch((err) => {
  console.error('Fatal Phase 1 Test Error:', err);
  process.exit(1);
});

