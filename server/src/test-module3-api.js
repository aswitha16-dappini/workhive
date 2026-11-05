import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import Milestone from './models/Milestone.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runModule3Tests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('===============================================================');
  console.log('🧪 WORKHIVE MODULE 3: PROPOSALS, BIDDING & ESCROW MILESTONES');
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

  // 1. Authenticate Client & Freelancers
  console.log('--- 1. Authenticating Test Users ---');
  const cLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'charlie@workhive.com', password: 'password123' }),
  });
  const cData = await cLogin.json();
  const cToken = cData.token;
  assert(cLogin.status === 200, 'Client Authenticated', cData.user?.name);

  const fLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const fData = await fLogin.json();
  const fToken = fData.token;
  assert(fLogin.status === 200, 'Freelancer Authenticated', fData.user?.name);

  // 2. Client Posts a Fresh Project for Module 3 testing
  console.log('\n--- 2. Creating Test Project ---');
  // Clean up any previous test project with this specific test title to ensure uniqueness
  await Project.deleteMany({ title: 'Full-Stack Escrow Collaboration Platform Dashboard' });

  const projRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      title: 'Full-Stack Escrow Collaboration Platform Dashboard',
      description: 'Need a senior engineer to develop an interactive milestone and proposal tracking module using React, Node.js, and MongoDB.',
      category: 'Web Development',
      budget: 1200,
      deadlineDays: 21,
      skillsRequired: ['React', 'Node.js', 'MongoDB', 'Express'],
    }),
  });
  const projData = await projRes.json();
  const projectId = projData.data?._id;
  assert(projRes.status === 201 && projectId, 'Project Created for Bidding', `ID: ${projectId}`);

  // 3. Validation: Client cannot submit a proposal to their own project
  console.log('\n--- 3. Proposal Validations & Role Guards ---');
  const clientBidRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`, // Client role
    },
    body: JSON.stringify({
      projectId,
      bidAmount: 1100,
      deliveryDays: 14,
      coverLetter: 'Client trying to bid on their own project.',
    }),
  });
  assert(clientBidRes.status === 403, 'Client role blocked from submitting proposal (403 Forbidden)');

  // 4. Validation: Freelancer submits invalid short cover letter
  const shortCoverRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      projectId,
      bidAmount: 1050,
      deliveryDays: 14,
      coverLetter: 'Too short',
    }),
  });
  assert(shortCoverRes.status === 400, 'Short cover letter (<20 chars) rejected (400 Bad Request)');

  // 5. Freelancer Submits Valid Proposal
  console.log('\n--- 4. Valid Proposal Submission ---');
  const validProposalRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      projectId,
      bidAmount: 1150,
      deliveryDays: 14,
      coverLetter: 'I have 5+ years of full-stack MERN experience and will implement clean REST APIs with full escrow milestone tracking.',
    }),
  });
  const validPropData = await validProposalRes.json();
  const proposalId = validPropData.data?._id;
  assert(validProposalRes.status === 201 && proposalId, 'Freelancer proposal submitted successfully', `Bid: $${validPropData.data?.bidAmount}`);

  // 6. Validation: Duplicate proposal blocked
  const duplicateRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      projectId,
      bidAmount: 1100,
      deliveryDays: 10,
      coverLetter: 'Submitting duplicate proposal should fail.',
    }),
  });
  assert(duplicateRes.status === 400, 'Duplicate proposal blocked for same freelancer and project (400)');

  // 7. Client Views Received Proposals
  console.log('\n--- 5. Proposals Retrieval ---');
  const clientViewProps = await fetch(`${baseUrl}/proposals/project/${projectId}`, {
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const clientPropsData = await clientViewProps.json();
  assert(clientViewProps.status === 200, 'Client can view received proposals', `Found: ${clientPropsData.count}`);
  assert(clientPropsData.data[0]?.bidAmount === 1150, 'Proposal bid amount correctly matches ($1150)');

  // 8. Freelancer Views My Proposals
  const myPropsRes = await fetch(`${baseUrl}/proposals/my`, {
    headers: { Authorization: `Bearer ${fToken}` },
  });
  const myPropsData = await myPropsRes.json();
  assert(myPropsRes.status === 200 && myPropsData.data.length > 0, 'Freelancer can view their submitted proposals');

  // 9. Client Accepts Proposal (Hires Freelancer & Locks Escrow)
  console.log('\n--- 6. Accept Proposal & Escrow Funding ---');
  const acceptRes = await fetch(`${baseUrl}/proposals/${proposalId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200, 'Client accepted proposal successfully');
  assert(acceptData.data?.proposal?.status === 'Accepted', 'Proposal status transitioned to Accepted');
  assert(acceptData.data?.project?.status === 'In Progress', 'Project status transitioned to In Progress');
  assert(acceptData.data?.project?.hiredFreelancer !== null, 'Project hiredFreelancer assigned');

  const initialMilestone = acceptData.data?.milestone;
  assert(initialMilestone && initialMilestone.escrowStatus === 'Funded_In_Escrow', 'Initial Milestone created and locked in Escrow', `Amount: $${initialMilestone?.amount}`);

  // 10. Client Creates Additional Milestone
  console.log('\n--- 7. Milestone Management ---');
  const addMilestoneRes = await fetch(`${baseUrl}/milestones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cToken}`,
    },
    body: JSON.stringify({
      projectId,
      title: 'Milestone 2: Final Testing & Documentation',
      description: 'Comprehensive integration tests and deployment documentation.',
      amount: 350,
      deliveryDays: 5,
    }),
  });
  const addMilestoneData = await addMilestoneRes.json();
  const milestone2 = addMilestoneData.data;
  assert(addMilestoneRes.status === 201 && milestone2, 'Client created additional milestone funded in Escrow', `Amount: $${milestone2?.amount}`);

  // 11. Freelancer Submits Work for Milestone 1
  console.log('\n--- 8. Milestone Deliverable Submission & Approval ---');
  const submitWorkRes = await fetch(`${baseUrl}/milestones/${initialMilestone._id}/submit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      submissionNotes: 'Completed core features, verified APIs, and committed code to GitHub repository.',
    }),
  });
  const submitWorkData = await submitWorkRes.json();
  assert(submitWorkRes.status === 200, 'Freelancer submitted milestone deliverable');
  assert(submitWorkData.data?.status === 'Submitted', 'Milestone status is Submitted');

  // 12. Security Check: Freelancer cannot approve their own milestone
  const unauthApprove = await fetch(`${baseUrl}/milestones/${initialMilestone._id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${fToken}` }, // Freelancer token
  });
  assert(unauthApprove.status === 403, 'Freelancer cannot approve/release their own milestone (403 Forbidden)');

  // 13. Client Approves Milestone 1 & Releases Escrow
  const approveM1 = await fetch(`${baseUrl}/milestones/${initialMilestone._id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const approveM1Data = await approveM1.json();
  assert(approveM1.status === 200, 'Client approved Milestone 1 and released escrow');
  assert(approveM1Data.data?.milestone?.escrowStatus === 'Released_To_Freelancer', 'Escrow status transitioned to Released_To_Freelancer');

  // 14. Approve Milestone 2 -> Project Automatically Marks Completed
  console.log('\n--- 9. Project Auto-Completion on Final Escrow Release ---');
  const approveM2 = await fetch(`${baseUrl}/milestones/${milestone2._id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cToken}` },
  });
  const approveM2Data = await approveM2.json();
  assert(approveM2.status === 200, 'Client approved Milestone 2');
  assert(approveM2Data.data?.projectCompleted === true, 'Project automatically marked Completed upon final escrow milestone release');

  // 15. MongoDB Direct Persistence Verification
  console.log('\n--- 10. Direct MongoDB Atlas Verification ---');
  const dbProposal = await Proposal.findById(proposalId);
  const dbMilestone1 = await Milestone.findById(initialMilestone._id);
  const dbProject = await Project.findById(projectId);

  assert(dbProposal.status === 'Accepted', 'MongoDB Atlas: Proposal status is Accepted');
  assert(dbMilestone1.escrowStatus === 'Released_To_Freelancer', 'MongoDB Atlas: Milestone 1 Escrow is Released_To_Freelancer');
  assert(dbProject.status === 'Completed', 'MongoDB Atlas: Project status is Completed');

  console.log('\n===============================================================');
  console.log(`📊 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('===============================================================');

  await mongoose.disconnect();
  if (results.failed.length > 0) process.exit(1);
};

runModule3Tests().catch((err) => {
  console.error('Fatal Module 3 Test Error:', err);
  process.exit(1);
});

