import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import Milestone from './models/Milestone.js';
import { generateMilestoneTitle, validateMilestoneTitle } from './utils/titleHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runMilestoneFundingTests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('========================================================================');
  console.log('🧪 WORKHIVE VERIFICATION: MILESTONE FUNDING & TITLE VALIDATION FIX');
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
  // TEST 1: SAFE MILESTONE TITLE GENERATION & VALIDATION LOGIC
  // ========================================================================
  console.log('--- TEST 1: TITLE GENERATION & VALIDATION LOGIC ---');

  // 1.1 The exact 83-character title of Aswitha's project that previously failed
  const aswithaProjectTitle = '[DEMO Opportunity] Social Media Short-Form Video Campaign (Reels / TikTok / Shorts)';
  const generatedAswithaTitle = generateMilestoneTitle('Milestone 1', aswithaProjectTitle, 120);
  assert(
    generatedAswithaTitle.length <= 120,
    'Generated title for 83-character project is <= 120 chars',
    `Length: ${generatedAswithaTitle.length} chars: "${generatedAswithaTitle}"`
  );

  // 1.2 Maximum 120-character project title
  const maxProjectTitle = 'A'.repeat(120);
  const generatedMaxTitle = generateMilestoneTitle('Milestone 1', maxProjectTitle, 120);
  assert(
    generatedMaxTitle.length <= 120,
    'Generated title for 120-char project title is strictly <= 120 chars',
    `Length: ${generatedMaxTitle.length} chars`
  );

  // 1.3 Empty / Missing project title fallback
  const fallbackTitle = generateMilestoneTitle('Milestone 1', '', 120);
  assert(
    fallbackTitle === 'Milestone 1: Primary Deliverable' && fallbackTitle.length <= 120,
    'Fallback title handled cleanly when project title is absent',
    fallbackTitle
  );

  // 1.4 User-entered title validation (> 120 chars rejected, <= 120 chars accepted)
  const tooLongTitle = 'X'.repeat(125);
  const validationLong = validateMilestoneTitle(tooLongTitle, 120);
  assert(!validationLong.valid && validationLong.error?.includes('cannot exceed 120 characters'), 'Rejects user title > 120 chars without silent truncation', validationLong.error);

  const goodTitle = 'Phase 1: Initial Architecture & Database Schemas';
  const validationGood = validateMilestoneTitle(goodTitle, 120);
  assert(validationGood.valid, 'Accepts valid user title <= 120 chars', goodTitle);

  // ========================================================================
  // TEST 2: LIVE ASWITHA CLIENT & KUMARI FREELANCER WORKFLOW
  // ========================================================================
  console.log('\n--- TEST 2: LIVE ASWITHA CLIENT & KUMARI FREELANCER WORKFLOW ---');

  const aswithaUser = await User.findOne({ email: 'aswitha160806@gmail.com' });
  const kumariUser = await User.findOne({ email: 'kumari@gmail.com' });

  assert(aswithaUser && aswithaUser.role === 'Client', 'Aswitha Client account located in Atlas', aswithaUser?.name);
  assert(kumariUser && kumariUser.role === 'Freelancer', 'Kumari Freelancer account located in Atlas', kumariUser?.name);

  const aswithaToken = jwt.sign({ id: aswithaUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const kumariToken = jwt.sign({ id: kumariUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Find Aswitha's project
  const aswithaProject = await Project.findOne({ client: aswithaUser._id, status: 'In Progress' });
  assert(aswithaProject, 'Aswitha In Progress project found in Atlas', aswithaProject?.title);

  // 2.1 Test POST /api/milestones with an oversized title (> 120 chars) -> Expect 400 Bad Request
  console.log('\n[2.1] Testing Milestone Creation with Oversized Title (Validation Guard)...');
  const oversizedRes = await fetch(`${baseUrl}/milestones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aswithaToken}`,
    },
    body: JSON.stringify({
      projectId: aswithaProject._id,
      title: 'This is an intentionally oversized milestone title designed to exceed the one hundred and twenty character limit enforced by the WorkHive validation rule',
      amount: 500,
    }),
  });
  const oversizedData = await oversizedRes.json();
  assert(
    oversizedRes.status === 400 && oversizedData.message?.includes('cannot exceed 120 characters'),
    'Backend returns 400 Bad Request for user title exceeding 120 characters',
    oversizedData.message
  );

  // 2.2 Test Funding Milestone for Aswitha's Project (Healing & Funding)
  console.log('\n[2.2] Testing Milestone Creation & Funding for Aswitha Project...');
  const fundRes = await fetch(`${baseUrl}/milestones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aswithaToken}`,
    },
    body: JSON.stringify({
      projectId: aswithaProject._id,
      amount: 950,
      deliveryDays: 7,
    }),
  });
  const fundData = await fundRes.json();
  const createdMilestone = fundData.data;

  assert(
    fundRes.status === 201 && createdMilestone,
    'Milestone created and funded in Escrow for Aswitha Project',
    `Status: ${createdMilestone?.status}, Escrow: ${createdMilestone?.escrowStatus}`
  );
  assert(
    createdMilestone?.title.length <= 120,
    'Created milestone title strictly within 120-character limit',
    `Length: ${createdMilestone?.title.length}c: "${createdMilestone?.title}"`
  );
  assert(
    createdMilestone?.amount === 950 && createdMilestone?.escrowStatus === 'Funded_In_Escrow',
    'Escrow deposit correctly set to $950 and status Funded_In_Escrow'
  );

  // 2.3 Verify in MongoDB Atlas
  const atlasMilestone = await Milestone.findById(createdMilestone._id);
  assert(
    atlasMilestone && atlasMilestone.escrowStatus === 'Funded_In_Escrow',
    'Milestone persists correctly in MongoDB Atlas',
    `Atlas ID: ${atlasMilestone?._id}`
  );

  // ========================================================================
  // TEST 3: DEDICATED FUND ACTION (PATCH /api/milestones/:id/fund)
  // ========================================================================
  console.log('\n--- TEST 3: DEDICATED FUND ACTION WORKFLOW ---');

  // Create a pending milestone awaiting funding
  const pendingMilestone = await Milestone.create({
    project: aswithaProject._id,
    client: aswithaUser._id,
    freelancer: kumariUser._id,
    title: 'Milestone 2: Revision and Optimization Pass',
    description: 'Secondary deliverable funded upon completion of primary pass.',
    amount: 300,
    status: 'Pending',
    escrowStatus: 'Awaiting_Funding',
  });

  assert(pendingMilestone && pendingMilestone.escrowStatus === 'Awaiting_Funding', 'Pending milestone initialized with Awaiting_Funding');

  // Client triggers Fund Milestone action
  const patchFundRes = await fetch(`${baseUrl}/milestones/${pendingMilestone._id}/fund`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${aswithaToken}`,
    },
  });
  const patchFundData = await patchFundRes.json();

  assert(
    patchFundRes.status === 200 && patchFundData.data?.escrowStatus === 'Funded_In_Escrow',
    'Client successfully triggered Fund Milestone action',
    patchFundData.message
  );

  // ========================================================================
  // TEST 4: DASHBOARD SYNCHRONIZATION
  // ========================================================================
  console.log('\n--- TEST 4: DASHBOARD SYNCHRONIZATION ---');

  // 4.1 Client Dashboard retrieves funded milestones
  const clientDashRes = await fetch(`${baseUrl}/milestones/client`, {
    headers: { Authorization: `Bearer ${aswithaToken}` },
  });
  const clientDashData = await clientDashRes.json();
  const clientHasFunded = clientDashData.data?.some((m) => m._id === createdMilestone._id && m.escrowStatus === 'Funded_In_Escrow');
  assert(clientHasFunded, 'Client Dashboard receives updated funded milestone', `Total milestones: ${clientDashData.data?.length}`);

  // 4.2 Freelancer Dashboard retrieves corresponding milestone
  const freeDashRes = await fetch(`${baseUrl}/milestones/my`, {
    headers: { Authorization: `Bearer ${kumariToken}` },
  });
  const freeDashData = await freeDashRes.json();
  const freeHasFunded = freeDashData.data?.some((m) => m._id === createdMilestone._id && m.status === 'Funded_Escrow');
  assert(freeHasFunded, 'Freelancer Dashboard receives corresponding milestone with Funded_Escrow status', `Total: ${freeDashData.data?.length}`);

  // ========================================================================
  // TEST 5: DELIVERABLE SUBMISSION & ESCROW RELEASE
  // ========================================================================
  console.log('\n--- TEST 5: DELIVERABLE SUBMISSION & ESCROW RELEASE ---');

  // 5.1 Freelancer Submits Deliverable
  const submitRes = await fetch(`${baseUrl}/milestones/${createdMilestone._id}/submit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${kumariToken}`,
    },
    body: JSON.stringify({
      submissionNotes: 'All short-form video reels, TikTok cuts, and shorts motion graphics exported and uploaded to review folder.',
    }),
  });
  const submitData = await submitRes.json();
  assert(
    submitRes.status === 200 && submitData.data?.status === 'Submitted',
    'Freelancer submitted deliverable work',
    `Status: ${submitData.data?.status}`
  );

  // 5.2 Client Approves Milestone & Releases Escrow
  const approveRes = await fetch(`${baseUrl}/milestones/${createdMilestone._id}/approve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${aswithaToken}`,
    },
  });
  const approveData = await approveRes.json();
  assert(
    approveRes.status === 200 && approveData.data?.milestone?.escrowStatus === 'Released_To_Freelancer',
    'Client approved milestone and released escrow funds to Freelancer',
    approveData.message
  );

  // Clean up secondary test-only milestone 2
  await Milestone.findByIdAndDelete(pendingMilestone._id);

  // ========================================================================
  // TEST 6: REGRESSION OF PRE-EXISTING MILESTONES & USERS
  // ========================================================================
  console.log('\n--- TEST 6: PRE-EXISTING DATA REGRESSION CHECKS ---');

  const charlieMilestones = await Milestone.find({}).populate('client');
  const demoMilestones = charlieMilestones.filter((m) => m.client?.email === 'charlie@workhive.com');
  assert(demoMilestones.length > 0, 'Pre-existing Charlie Client milestones remain intact in Atlas', `Count: ${demoMilestones.length}`);

  const charlieUser = await User.findOne({ email: 'charlie@workhive.com' });
  const danaUser = await User.findOne({ email: 'dana@workhive.com' });
  assert(charlieUser && danaUser, 'Demo users Charlie and Dana remain intact');

  console.log('\n========================================================================');
  console.log(`📊 FINAL SUMMARY: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('========================================================================\n');

  if (results.failed.length > 0) {
    process.exit(1);
  }
  process.exit(0);
};

runMilestoneFundingTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

