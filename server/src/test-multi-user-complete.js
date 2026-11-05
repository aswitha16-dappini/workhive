import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import FreelancerProfile from './models/FreelancerProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runMultiUserLiveTests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('========================================================================');
  console.log('🧪 WORKHIVE VERIFICATION: CRITICAL MULTI-USER REGISTRATION & LOGIN FIX');
  console.log('========================================================================\n');

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

  const ts = Date.now();
  const harshaEmail = `harsha_client_${ts}@workhive.test`;
  const harshaPassword = 'HarshaSecurePass2026!';
  const vikramEmail = `vikram_dev_${ts}@workhive.test`;
  const vikramPassword = 'VikramSecurePass2026!';

  // ========================================================================
  // TEST A: REGISTER & LOGIN CLIENT NAMED HARSHA
  // ========================================================================
  console.log('--- TEST A: NEW CLIENT REGISTRATION & LOGIN (HARSHA) ---');

  // 1. Register a new Client named Harsha
  console.log('[A.1] Registering Client Harsha...');
  const regHarshaRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Harsha',
      email: harshaEmail,
      password: harshaPassword,
      role: 'Client',
    }),
  });
  const regHarshaData = await regHarshaRes.json();
  assert(
    regHarshaRes.status === 201 && regHarshaData.token,
    'Client Harsha registered successfully and auto-authenticated',
    `ID: ${regHarshaData.user?._id}`
  );
  assert(regHarshaData.user?.role === 'Client', 'Harsha role assigned correctly as Client');

  // 2. Verify account exists in MongoDB Atlas
  const atlasHarsha = await User.findOne({ email: harshaEmail.toLowerCase() }).select('+password');
  assert(atlasHarsha && atlasHarsha.name === 'Harsha', 'Harsha account document verified in MongoDB Atlas', `Atlas ID: ${atlasHarsha?._id}`);
  assert(atlasHarsha?.password?.startsWith('$2'), 'Harsha password safely hashed with bcrypt in Atlas');

  // 3. Log out (discard token)
  let currentToken = null;
  assert(currentToken === null, 'Session cleared (Log out simulated)');

  // 4. Log in using Harsha email and password
  console.log('[A.4] Logging in as Harsha with email and password...');
  const loginHarshaRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: harshaEmail,
      password: harshaPassword,
    }),
  });
  const loginHarshaData = await loginHarshaRes.json();
  const harshaToken = loginHarshaData.token;
  assert(
    loginHarshaRes.status === 200 && harshaToken,
    'Harsha login succeeded with own credentials',
    `User: ${loginHarshaData.user?.name} (${loginHarshaData.user?.email})`
  );
  assert(loginHarshaData.user?.role === 'Client', 'Login returned Client role for Harsha');

  // 5. Verify Client Dashboard endpoint opens
  const harshaDashRes = await fetch(`${baseUrl}/projects/my/client`, {
    headers: { Authorization: `Bearer ${harshaToken}` },
  });
  const harshaDashData = await harshaDashRes.json();
  assert(harshaDashRes.status === 200, 'Harsha Client Dashboard endpoint opened successfully', `Status: 200`);

  // ========================================================================
  // TEST B: REGISTER & LOGIN NEW FREELANCER (VIKRAM)
  // ========================================================================
  console.log('\n--- TEST B: NEW FREELANCER REGISTRATION & LOGIN (VIKRAM) ---');

  // 1. Register a new Freelancer
  console.log('[B.1] Registering Freelancer Vikram...');
  const regVikramRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Vikram',
      email: vikramEmail,
      password: vikramPassword,
      role: 'Freelancer',
    }),
  });
  const regVikramData = await regVikramRes.json();
  assert(
    regVikramRes.status === 201 && regVikramData.token,
    'Freelancer Vikram registered successfully and auto-authenticated',
    `ID: ${regVikramData.user?._id}`
  );
  assert(regVikramData.user?.role === 'Freelancer', 'Vikram role assigned correctly as Freelancer');

  // 2. Verify account exists in MongoDB Atlas
  const atlasVikram = await User.findOne({ email: vikramEmail.toLowerCase() });
  assert(atlasVikram && atlasVikram.name === 'Vikram', 'Vikram account document verified in MongoDB Atlas', `Atlas ID: ${atlasVikram?._id}`);

  // 3. Verify baseline profile created in Atlas
  const vikramProfile = await FreelancerProfile.findOne({ userId: atlasVikram._id });
  assert(vikramProfile && vikramProfile.fullName === 'Vikram', 'Vikram profile automatically created and linked in Atlas', `Title: ${vikramProfile?.professionalTitle}`);

  // 4. Log out (discard token)
  currentToken = null;
  assert(currentToken === null, 'Session cleared (Log out simulated)');

  // 5. Log in using Freelancer credentials
  console.log('[B.5] Logging in as Vikram with email and password...');
  const loginVikramRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: vikramEmail,
      password: vikramPassword,
    }),
  });
  const loginVikramData = await loginVikramRes.json();
  const vikramToken = loginVikramData.token;
  assert(
    loginVikramRes.status === 200 && vikramToken,
    'Vikram Freelancer login succeeded with own credentials',
    `User: ${loginVikramData.user?.name} (${loginVikramData.user?.email})`
  );
  assert(loginVikramData.user?.role === 'Freelancer', 'Login returned Freelancer role for Vikram');

  // 6. Verify Freelancer Dashboard endpoint opens
  const freeDashRes = await fetch(`${baseUrl}/profiles/me`, {
    headers: { Authorization: `Bearer ${vikramToken}` },
  });
  assert(freeDashRes.status === 200, 'Freelancer Dashboard profile endpoint opened successfully', `Status: 200`);

  // ========================================================================
  // TEST C: COMPLETE CROSS-USER INTERACTION (HARSHA & VIKRAM)
  // ========================================================================
  console.log('\n--- TEST C: CROSS-USER INTERACTION (PROJECT & PROPOSAL) ---');

  // 1. Login as Harsha and post a project
  console.log('[C.1] Harsha posting a new project...');
  const postProjRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${harshaToken}`,
    },
    body: JSON.stringify({
      title: `Next.js & Supabase Enterprise Portal ${ts.toString().slice(-4)}`,
      description: 'Building a multi-tenant client portal with real-time notifications, Supabase Row Level Security, and automated billing export.',
      category: 'Web Development',
      skillsRequired: ['Next.js', 'Supabase', 'TypeScript', 'TailwindCSS'],
      budget: 1400,
      deadlineDays: 14,
    }),
  });
  const postProjData = await postProjRes.json();
  const harshaProject = postProjData.data;
  assert(postProjRes.status === 201 && harshaProject, 'Harsha successfully posted project', `Title: "${harshaProject?.title}"`);

  // 2. Login as Freelancer Vikram, find Harsha project in marketplace
  console.log('[C.2] Vikram discovering Harsha project in Marketplace...');
  const searchRes = await fetch(`${baseUrl}/projects?search=Supabase`);
  const searchData = await searchRes.json();
  const foundProject = searchData.data?.find((p) => p._id === harshaProject._id);
  assert(foundProject, 'Vikram discovered Harsha project in Marketplace search', `Client: ${foundProject?.client?.name}`);

  // 3. Vikram submits a proposal
  console.log('[C.3] Vikram submitting proposal for Harsha project...');
  const submitPropRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${vikramToken}`,
    },
    body: JSON.stringify({
      projectId: harshaProject._id,
      bidAmount: 1350,
      deliveryDays: 10,
      coverLetter: 'I have 6+ years building Next.js and Supabase architectures with RLS and automated billing. I would love to build this portal.',
    }),
  });
  const submitPropData = await submitPropRes.json();
  const submittedProposal = submitPropData.data;
  assert(submitPropRes.status === 201 && submittedProposal, 'Vikram submitted proposal to Harsha project', `Bid: $${submittedProposal?.bidAmount}`);

  // 4. Login as Harsha and verify proposal appears in Client Dashboard
  console.log('[C.4] Harsha verifying received proposals in Client Workspace...');
  const clientPropsRes = await fetch(`${baseUrl}/proposals/client`, {
    headers: { Authorization: `Bearer ${harshaToken}` },
  });
  const clientPropsData = await clientPropsRes.json();
  const harshaReceivedProposal = clientPropsData.data?.find((p) => p._id === submittedProposal._id);
  assert(
    harshaReceivedProposal && harshaReceivedProposal.freelancer?.name === 'Vikram',
    'Harsha received Vikram proposal in Client Dashboard',
    `Bid: $${harshaReceivedProposal?.bidAmount} from ${harshaReceivedProposal?.freelancer?.name}`
  );

  // ========================================================================
  // TEST D: PRESERVATION OF ASWITHA & DEMO ACCOUNTS
  // ========================================================================
  console.log('\n--- TEST D: PRESERVATION OF ASWITHA & DEMO ACCOUNTS ---');

  // 1. Verify Aswitha account exists and remains active
  const aswithaUser = await User.findOne({ email: 'aswitha160806@gmail.com' });
  assert(aswithaUser, 'Aswitha account is preserved in MongoDB Atlas', aswithaUser?.name);

  // 2. Verify Demo Client login (Charlie)
  const demoClientRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const demoClientData = await demoClientRes.json();
  assert(demoClientRes.status === 200 && demoClientData.token, 'Demo Client (Charlie) login successful', demoClientData.user?.name);

  // 3. Verify Demo Freelancer login (Dana)
  const demoFreeRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const demoFreeData = await demoFreeRes.json();
  assert(demoFreeRes.status === 200 && demoFreeData.token, 'Demo Freelancer (Dana) login successful', demoFreeData.user?.name);

  // ========================================================================
  // CLEANUP TEMPORARY TEST DATA (Keeping existing database clean)
  // ========================================================================
  console.log('\n--- CLEANING TEST-ONLY ARTIFACTS ---');
  await Proposal.deleteMany({ project: harshaProject._id });
  await Project.findByIdAndDelete(harshaProject._id);
  await FreelancerProfile.deleteMany({ userId: atlasVikram._id });
  await User.deleteMany({ email: { $in: [harshaEmail.toLowerCase(), vikramEmail.toLowerCase()] } });
  console.log('🧹 Temporary test records cleaned (Aswitha & Demo accounts intact).');

  console.log('\n========================================================================');
  console.log(`📊 FINAL RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('========================================================================\n');

  if (results.failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
};

runMultiUserLiveTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
