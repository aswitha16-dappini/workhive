import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Project from './models/Project.js';
import Proposal from './models/Proposal.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runPhase2Tests = async () => {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('===============================================================');
  console.log('🧪 WORKHIVE PHASE 2 TEST: DIVERSE JOB MARKETPLACE & FILTERS');
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

  const expectedCategories = [
    'Web Development',
    'Mobile App Development',
    'UI/UX Design',
    'Graphic Design',
    'Data Analytics',
    'Artificial Intelligence & Machine Learning',
    'Content Writing',
    'Digital Marketing',
    'DevOps & Cloud',
    'Video Editing',
  ];

  // 1. Verify all 10 categories have opportunities in MongoDB
  console.log('--- 1. Verifying Category Coverage in MongoDB Atlas ---');
  for (const cat of expectedCategories) {
    const count = await Project.countDocuments({ category: cat });
    assert(count > 0, `Category "${cat}" has active opportunities`, `Count: ${count}`);
  }

  // 2. Verify API Category Filtering
  console.log('\n--- 2. Verifying API Category Filters (GET /api/projects?category=...) ---');
  const catRes = await fetch(`${baseUrl}/projects?category=${encodeURIComponent('Data Analytics')}`);
  const catData = await catRes.json();
  assert(catRes.status === 200, 'GET /api/projects?category=Data Analytics returned 200 OK');
  const allDataAnalytics = catData.data.every((p) => p.category === 'Data Analytics');
  assert(allDataAnalytics && catData.data.length > 0, 'Every returned project belongs to Data Analytics', `Found: ${catData.count}`);

  const uiuxRes = await fetch(`${baseUrl}/projects?category=${encodeURIComponent('UI/UX Design')}`);
  const uiuxData = await uiuxRes.json();
  const allUiUx = uiuxData.data.every((p) => p.category === 'UI/UX Design' || p.category === 'Design & Creative');
  assert(allUiUx && uiuxData.data.length > 0, 'Category filter for UI/UX Design works correctly', `Found: ${uiuxData.count}`);

  // 3. Verify API Keyword Search
  console.log('\n--- 3. Verifying API Keyword Search (GET /api/projects?search=...) ---');
  const searchRes = await fetch(`${baseUrl}/projects?search=Kubernetes`);
  const searchData = await searchRes.json();
  assert(searchRes.status === 200 && searchData.data.length > 0, 'Search keyword "Kubernetes" returns matching DevOps project', `Found: ${searchData.count}`);
  assert(
    searchData.data[0].title.toLowerCase().includes('kubernetes') ||
      searchData.data[0].skillsRequired.includes('Kubernetes'),
    'Match contains searched keyword'
  );

  // 4. Verify API Budget Filters
  console.log('\n--- 4. Verifying API Budget Range Filters ---');
  const minBudgetRes = await fetch(`${baseUrl}/projects?minBudget=2500`);
  const minBudgetData = await minBudgetRes.json();
  const allMinBudget = minBudgetData.data.every((p) => p.budget >= 2500);
  assert(allMinBudget && minBudgetData.data.length > 0, 'minBudget=2500 filter returns only projects >= $2,500', `Count: ${minBudgetData.count}`);

  const maxBudgetRes = await fetch(`${baseUrl}/projects?maxBudget=1000`);
  const maxBudgetData = await maxBudgetRes.json();
  const allMaxBudget = maxBudgetData.data.every((p) => p.budget <= 1000);
  assert(allMaxBudget && maxBudgetData.data.length > 0, 'maxBudget=1000 filter returns only projects <= $1,000', `Count: ${maxBudgetData.count}`);

  // 5. Verify API Skill Filter
  console.log('\n--- 5. Verifying API Skill Filters ---');
  const skillRes = await fetch(`${baseUrl}/projects?skill=Figma`);
  const skillData = await skillRes.json();
  const allFigma = skillData.data.every((p) =>
    p.skillsRequired.some((s) => s.toLowerCase().includes('figma'))
  );
  assert(allFigma && skillData.data.length > 0, 'Skill filter "Figma" returns matching projects', `Count: ${skillData.count}`);

  // 6. Verify No Duplicate Project Titles
  console.log('\n--- 6. Verifying No Duplicate Project Titles ---');
  const allProjects = await Project.find().select('title');
  const titleSet = new Set();
  let duplicates = 0;
  for (const p of allProjects) {
    if (titleSet.has(p.title)) {
      duplicates++;
    }
    titleSet.add(p.title);
  }
  assert(duplicates === 0, 'No duplicate project titles found in MongoDB Atlas', `Total: ${allProjects.length} unique projects`);

  // 7. Verify Client Information Population
  console.log('\n--- 7. Verifying Client Names & Ownership Diversity ---');
  const populatedProjects = await Project.find().populate('client', 'name email');
  const distinctClientNames = new Set(populatedProjects.map((p) => p.client?.name).filter(Boolean));
  assert(distinctClientNames.size >= 3, 'Projects are distributed across multiple distinct client accounts', `Clients: ${Array.from(distinctClientNames).join(', ')}`);
  const allHaveClientName = populatedProjects.every((p) => p.client && p.client.name);
  assert(allHaveClientName, 'Every project in marketplace has an actual client name');

  // 8. Proposal Regression Test
  console.log('\n--- 8. Testing Proposal Workflow Regression on Seeded Project ---');
  const fLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dana@workhive.com', password: 'password123' }),
  });
  const fData = await fLogin.json();
  const fToken = fData.token;
  assert(fLogin.status === 200 && fToken, 'Freelancer Authenticated (Dana Sterling)');

  // Pick a project where Dana hasn't bid yet (e.g., in Graphic Design)
  const graphicProj = await Project.findOne({
    category: 'Graphic Design',
    status: 'Open',
  });
  assert(graphicProj !== null, 'Found open Graphic Design project for proposal test', graphicProj?.title);

  // Clean any previous proposal on this specific project
  await Proposal.deleteMany({ project: graphicProj._id, freelancer: fData.user._id });

  const submitRes = await fetch(`${baseUrl}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fToken}`,
    },
    body: JSON.stringify({
      projectId: graphicProj._id,
      bidAmount: graphicProj.budget,
      deliveryDays: 10,
      coverLetter: 'I am highly experienced with branding, vector assets, and design systems. Looking forward to collaborating on this deliverable.',
    }),
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 201 && submitData.success, 'Proposal successfully submitted on newly seeded project', `ID: ${submitData.data?._id}`);

  // 9. Verify Updated Project Proposal Count
  const updatedProj = await Project.findById(graphicProj._id);
  assert(updatedProj.proposalsCount >= 1, 'Project proposalsCount dynamically incremented in MongoDB Atlas', `Count: ${updatedProj.proposalsCount}`);

  // 10. Verify GET /api/stats Reflects Up-To-Date Counts
  console.log('\n--- 9. Verifying Live /api/stats Reflects Seeded Projects ---');
  const finalStatsRes = await fetch(`${baseUrl}/stats`);
  const finalStatsData = await finalStatsRes.json();
  assert(finalStatsData.data?.totalProjects >= 23, 'Total projects in MongoDB Atlas reflects newly seeded opportunities', `Total: ${finalStatsData.data?.totalProjects}`);

  console.log('\n===============================================================');
  console.log(`📊 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('===============================================================');

  await mongoose.disconnect();
  if (results.failed.length > 0) process.exit(1);
};

runPhase2Tests().catch((err) => {
  console.error('Fatal Phase 2 Test Error:', err);
  process.exit(1);
});
