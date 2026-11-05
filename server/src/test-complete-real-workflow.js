import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import Milestone from './models/Milestone.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import ClientProfile from './models/ClientProfile.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runCompleteWorkflowTests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('========================================================================');
  console.log('🧪 WORKHIVE END-TO-END TEST: DEMO WORKFLOW & REAL USER REGISTRATION');
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

  // ========================================================================
  // PART 1: DEMO ACCOUNTS WORKFLOW
  // ========================================================================
  console.log('--- PART 1: DEMO ACCOUNTS WORKFLOW ---');

  // 1.1 Demo Client Login
  const demoClientRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const demoClientData = await demoClientRes.json();
  const demoClientToken = demoClientData.token;
  assert(demoClientRes.status === 200 && demoClientToken, 'Demo Client Login Successful', demoClientData.user?.name);
  assert(demoClientData.user?.role === 'Client', 'Demo Client Role is Client');

  // 1.2 Verify Demo Client Projects in MongoDB Atlas
  const demoProjectsRes = await fetch(`${baseUrl}/projects/my/client`, {
    headers: { Authorization: `Bearer ${demoClientToken}` },
  });
  const demoProjectsData = await demoProjectsRes.json();
  assert(demoProjectsRes.status === 200 && demoProjectsData.data?.length > 0, 'Demo Client projects retrieved from Atlas', `Count: ${demoProjectsData.data?.length}`);

  // 1.3 Demo Freelancer Login
  const demoFreeRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const demoFreeData = await demoFreeRes.json();
  const demoFreeToken = demoFreeData.token;
  assert(demoFreeRes.status === 200 && demoFreeToken, 'Demo Freelancer Login Successful', demoFreeData.user?.name);
  assert(demoFreeData.user?.role === 'Freelancer', 'Demo Freelancer Role is Freelancer');

  // 1.4 Verify Demo Freelancer Profile in MongoDB Atlas
  const demoProfileRes = await fetch(`${baseUrl}/profiles/me`, {
    headers: { Authorization: `Bearer ${demoFreeToken}` },
  });
  const demoProfileData = await demoProfileRes.json();
  assert(demoProfileRes.status === 200 && demoProfileData.data?.skills?.length > 0, 'Demo Freelancer profile intact in Atlas', `Title: ${demoProfileData.data?.professionalTitle}`);

  // ========================================================================
  // PART 2: REAL USER REGISTRATION & COMPLETE MARKETPLACE WORKFLOW
  // ========================================================================
  console.log('\n--- PART 2: REAL USER REGISTRATION & WORKFLOW ---');
  const ts = Date.now();
  const realClientEmail = `real_client_${ts}@workhive.test`;
  const realClientPass = 'ClientSecurePass123!';
  const realFreeEmail = `real_freelancer_${ts}@workhive.test`;
  const realFreePass = 'FreeSecurePass123!';

  // 2.1 Register New Real Client
  console.log('\n[2.1] Registering Real Client Account...');
  const regClientRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Sarah Connor ${ts.toString().slice(-4)}`,
      email: realClientEmail,
      password: realClientPass,
      role: 'Client',
    }),
  });
  const regClientData = await regClientRes.json();
  const realClientToken = regClientData.token;
  const realClientId = regClientData.user?._id;

  assert(regClientRes.status === 201 && realClientToken, 'Real Client Registered & Auto-Authenticated', `ID: ${realClientId}`);
  assert(regClientData.user?.role === 'Client', 'Real Client assigned role Client');

  // Verify duplicate email is prevented
  const dupEmailRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Test',
      email: realClientEmail,
      password: 'password123',
      role: 'Client',
    }),
  });
  assert(dupEmailRes.status === 400, 'Duplicate email registration rejected (400 Bad Request)');

  // 2.2 Real Client creates/updates Company Profile
  console.log('\n[2.2] Real Client Updating Company Profile...');
  const compProfileRes = await fetch(`${baseUrl}/client-profile/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${realClientToken}`,
    },
    body: JSON.stringify({
      companyName: 'Cyberdyne Systems AI Labs',
      companyWebsite: 'https://cyberdyne-ai.io',
      industry: 'Artificial Intelligence & Machine Learning',
      location: 'San Francisco, CA',
      companyDescription: 'Building autonomous distributed intelligence pipelines with milestone-based engineering.',
    }),
  });
  const compProfileData = await compProfileRes.json();
  assert(compProfileRes.status === 200, 'Real Client company profile saved to Atlas', compProfileData.data?.companyName);

  // 2.3 Real Client Posts a New Project
  console.log('\n[2.3] Real Client Posting New Project...');
  const projectTitle = `Autonomous AI Agent Pipeline Engine [${ts}]`;
  const postProjectRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${realClientToken}`,
    },
    body: JSON.stringify({
      title: projectTitle,
      description: 'Need an expert AI engineer to architect a multi-agent orchestration framework with LangChain, FastAPI, and MongoDB Atlas.',
      category: 'Artificial Intelligence & Machine Learning',
      budget: 1850,
      deadlineDays: 14,
      skillsRequired: ['Python', 'FastAPI', 'LangChain', 'MongoDB'],
    }),
  });
  const postProjectData = await postProjectRes.json();
  const realProjectId = postProjectData.data?._id;
  assert(postProjectRes.status === 201 && realProjectId, 'Real Client Project Posted successfully', `Budget: $${postProjectData.data?.budget}`);

  // 2.4 Register New Real Freelancer
  console.log('\n[2.4] Registering Real Freelancer Account...');
  const regFreeRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Marcus Wright ${ts.toString().slice(-4)}`,
      email: realFreeEmail,
      password: realFreePass,
      role: 'Freelancer',
    }),
  });
  const regFreeData = await regFreeRes.json();
  const realFreeToken = regFreeData.token;
  const realFreeId = regFreeData.user?._id;

  assert(regFreeRes.status === 201 && realFreeToken, 'Real Freelancer Registered & Auto-Authenticated', `ID: ${realFreeId}`);
  assert(regFreeData.user?.role === 'Freelancer', 'Real Freelancer assigned role Freelancer');

  // 2.5 Real Freelancer Creates Profile
  console.log('\n[2.5] Real Freelancer Creating Profile...');
  const freeProfileRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${realFreeToken}`,
    },
    body: JSON.stringify({
      fullName: `Marcus Wright ${ts.toString().slice(-4)}`,
      professionalTitle: 'Principal AI & LLM Systems Architect',
      bio: 'Over 8 years architecting neural networks, autonomous agents, and scalable microservices.',
      skills: ['Python', 'LangChain', 'FastAPI', 'MongoDB', 'Docker', 'AWS'],
      experienceLevel: 'Expert',
      hourlyRate: 115,
      location: 'Austin, TX',
      collegeName: 'Stanford University',
      portfolioLinks: ['https://github.com/marcus-ai/agent-core'],
    }),
  });
  const freeProfileData = await freeProfileRes.json();
  const realProfileId = freeProfileData.data?._id;
  assert(freeProfileRes.status === 201 && realProfileId, 'Real Freelancer profile created in Atlas', freeProfileData.data?.professionalTitle);

  // 2.6 Real Freelancer Finds Real Client's Project in Marketplace
  console.log('\n[2.6] Real Freelancer Discovering Client Project in Marketplace...');
  const searchRes = await fetch(`${baseUrl}/projects?search=${encodeURIComponent(projectTitle)}`);
  const searchData = await searchRes.json();
  const foundProject = searchData.data?.find((p) => p._id === realProjectId);
  assert(foundProject !== undefined, 'Real Freelancer discovered Real Client project in Marketplace search');
  assert(foundProject?.client?.name.includes('Sarah Connor'), 'Project correctly reflects real client name (not hardcoded)');

  // 2.7 Real Freelancer Submits Proposal
  console.log('\n[2.7] Real Freelancer Submitting Proposal...');
  const proposalRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${realFreeToken}`,
    },
    body: JSON.stringify({
      projectId: realProjectId,
      bidAmount: 1800,
      deliveryDays: 12,
      coverLetter: 'I have delivered 15+ production LLM multi-agent systems with complete test coverage. I will implement the orchestration engine with full milestone documentation.',
    }),
  });
  const proposalData = await proposalRes.json();
  const realProposalId = proposalData.data?._id;
  assert(proposalRes.status === 201 && realProposalId, 'Real Freelancer proposal submitted', `Bid: $${proposalData.data?.bidAmount}`);

  // 2.8 Real Client Reviews Received Proposals
  console.log('\n[2.8] Real Client Reviewing Received Proposals...');
  const clientReviewRes = await fetch(`${baseUrl}/proposals/project/${realProjectId}`, {
    headers: { Authorization: `Bearer ${realClientToken}` },
  });
  const clientReviewData = await clientReviewRes.json();
  assert(clientReviewRes.status === 200 && clientReviewData.data?.length === 1, 'Real Client received the proposal');
  assert(clientReviewData.data[0]?.freelancer?.name.includes('Marcus Wright'), 'Proposal reflects real freelancer identity');
  assert(clientReviewData.data[0]?.freelancerProfile?.hourlyRate === 115, 'Proposal includes freelancer hourly rate ($115)');

  // 2.9 Real Client Accepts Proposal & Funds Escrow
  console.log('\n[2.9] Real Client Accepting Proposal & Funding Escrow...');
  const acceptRes = await fetch(`${baseUrl}/proposals/${realProposalId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${realClientToken}` },
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, 'Proposal accepted by client');
  assert(acceptData.data?.project?.status === 'In Progress', 'Project transitioned to In Progress');
  assert(acceptData.data?.project?.hiredFreelancer === realFreeId, 'Real Freelancer assigned as hired talent');

  const realMilestoneId = acceptData.data?.milestone?._id;
  assert(realMilestoneId && acceptData.data?.milestone?.escrowStatus === 'Funded_In_Escrow', 'Initial Escrow Milestone locked in Escrow ($1800)');

  // 2.10 Real Freelancer Submits Deliverable Work
  console.log('\n[2.10] Real Freelancer Submitting Milestone Deliverable...');
  const submitWorkRes = await fetch(`${baseUrl}/milestones/${realMilestoneId}/submit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${realFreeToken}`,
    },
    body: JSON.stringify({
      submissionNotes: 'Completed full multi-agent orchestration engine. Code pushed to GitHub staging branch and verified with unit tests.',
    }),
  });
  const submitWorkData = await submitWorkRes.json();
  assert(submitWorkRes.status === 200, 'Real Freelancer submitted milestone deliverable');
  assert(submitWorkData.data?.status === 'Submitted', 'Milestone status is Submitted');

  // 2.11 Real Client Approves Deliverable & Releases Escrow
  console.log('\n[2.11] Real Client Approving Milestone & Releasing Escrow...');
  const approveRes = await fetch(`${baseUrl}/milestones/${realMilestoneId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${realClientToken}` },
  });
  const approveData = await approveRes.json();
  assert(approveRes.status === 200, 'Client approved milestone and released escrow funds');
  assert(approveData.data?.milestone?.escrowStatus === 'Released_To_Freelancer', 'Escrow status transitioned to Released_To_Freelancer');
  assert(approveData.data?.projectCompleted === true, 'Project automatically marked Completed');

  // 2.12 Future Login Verification for Both Real Users
  console.log('\n[2.12] Verifying Subsequent Login with Own Credentials...');
  const futureClientLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: realClientEmail, password: realClientPass }),
  });
  const futureClientData = await futureClientLogin.json();
  assert(futureClientLogin.status === 200 && futureClientData.token, 'Real Client future login succeeded with own credentials');

  const futureFreeLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: realFreeEmail, password: realFreePass }),
  });
  const futureFreeData = await futureFreeLogin.json();
  assert(futureFreeLogin.status === 200 && futureFreeData.token, 'Real Freelancer future login succeeded with own credentials');

  // ========================================================================
  // CLEANUP TEMPORARY TEST DATA (Non-destructive to existing demo records)
  // ========================================================================
  console.log('\n--- CLEANING TEST-ONLY ARTIFACTS ---');
  await Milestone.deleteMany({ project: realProjectId });
  await Proposal.deleteMany({ project: realProjectId });
  await Project.findByIdAndDelete(realProjectId);
  await FreelancerProfile.findByIdAndDelete(realProfileId);
  await ClientProfile.findOneAndDelete({ userId: realClientId });
  await User.findByIdAndDelete(realClientId);
  await User.findByIdAndDelete(realFreeId);
  console.log('🧹 Cleaned temporary test accounts & project (Demo data untouched).');

  console.log('\n========================================================================');
  console.log(`📊 FINAL RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('========================================================================');

  await mongoose.disconnect();
  if (results.failed.length > 0) process.exit(1);
};

runCompleteWorkflowTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});

