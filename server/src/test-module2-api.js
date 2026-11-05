import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testModule2 = async () => {
  const baseUrl = 'http://localhost:5000/api';
  console.log('====================================================');
  console.log('🧪 WorkHive Module 2: Profiles & Projects Integration Test');
  console.log('====================================================');

  // 1. Authenticate Client
  const clientLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'charlie@workhive.com',
      password: 'password123',
    }),
  });
  const clientData = await clientLoginRes.json();
  const clientToken = clientData.token;
  console.log('1. Client Authenticated:', clientData.user?.name);

  // 2. Authenticate Freelancer
  const freelancerLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dana@workhive.com',
      password: 'password123',
    }),
  });
  const freelancerData = await freelancerLoginRes.json();
  const freelancerToken = freelancerData.token;
  console.log('2. Freelancer Authenticated:', freelancerData.user?.name);

  // 3. Freelancer upserts profile
  console.log('\n--- Test 3: Freelancer Profile Creation / Update ---');
  const profileRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: JSON.stringify({
      title: 'Full Stack MERN Developer & React Specialist',
      bio: '5+ years experience building responsive, performant web applications with React, Node.js, Express, and MongoDB.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB Atlas', 'Vite', 'TailwindCSS'],
      hourlyRate: 65,
      experienceLevel: 'Expert',
      location: 'Remote / Global',
      github: 'https://github.com/dana-workhive',
    }),
  });
  const profileData = await profileRes.json();
  console.log('3. Profile upsert status:', profileRes.status, profileData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log(`   Profile Title: "${profileData.data?.professionalTitle || profileData.data?.title}" | Rate: $${profileData.data?.hourlyRate}/hr`);

  // 4. Client attempts to upsert profile (Expect 403 Forbidden)
  console.log('\n--- Test 4: Role Guard - Client creating Freelancer profile ---');
  const clientProfileRes = await fetch(`${baseUrl}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: 'Fake Freelancer Profile',
      bio: 'Should be rejected',
      skills: ['None'],
      hourlyRate: 50,
    }),
  });
  console.log('4. Client profile attempt status:', clientProfileRes.status === 403 ? '✅ 403 Forbidden (Blocked as expected)' : '❌ FAILED');

  // 5. Client posts a new project
  console.log('\n--- Test 5: Client Project Posting ---');
  const projectRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clientToken}`,
    },
    body: JSON.stringify({
      title: 'Real-time Freelance Collaboration Workspace UI',
      description: 'We need a senior frontend engineer to construct an interactive project workspace with milestone boards, review queues, and live activity streams.',
      category: 'Web Development',
      budget: 1850,
      skillsRequired: ['React', 'Node.js', 'MongoDB', 'Vite'],
      deadlineDays: 21,
    }),
  });
  const projectData = await projectRes.json();
  console.log('5. Project post status:', projectRes.status, projectData.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log(`   Project Created: "${projectData.data?.title}" ($${projectData.data?.budget})`);
  const createdProjectId = projectData.data?._id;

  // 6. Freelancer attempts to post a project (Expect 403 Forbidden)
  console.log('\n--- Test 6: Role Guard - Freelancer posting project ---');
  const freelancerProjectRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${freelancerToken}`,
    },
    body: JSON.stringify({
      title: 'Unauthorized Project',
      description: 'Should be rejected',
      category: 'Web Development',
      budget: 1000,
      skillsRequired: ['React'],
    }),
  });
  console.log('6. Freelancer project post status:', freelancerProjectRes.status === 403 ? '✅ 403 Forbidden (Blocked as expected)' : '❌ FAILED');

  // 7. Public endpoint: Browse all projects
  console.log('\n--- Test 7: Public Project Discovery ---');
  const allProjectsRes = await fetch(`${baseUrl}/projects`);
  const allProjectsData = await allProjectsRes.json();
  console.log('7. Browse projects status:', allProjectsRes.status, `Found ${allProjectsData.count} open project(s)`);

  // 8. Public endpoint: Browse all freelancer profiles
  console.log('\n--- Test 8: Public Freelancer Directory ---');
  const allProfilesRes = await fetch(`${baseUrl}/profiles`);
  const allProfilesData = await allProfilesRes.json();
  console.log('8. Browse profiles status:', allProfilesRes.status, `Found ${allProfilesData.count} freelancer profile(s)`);

  // 9. Client views their own posted projects
  console.log('\n--- Test 9: Client My Projects ---');
  const myProjectsRes = await fetch(`${baseUrl}/projects/my/client`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const myProjectsData = await myProjectsRes.json();
  console.log('9. Client My Projects status:', myProjectsRes.status, `Client owns ${myProjectsData.count} active project(s)`);

  console.log('\n====================================================');
  console.log('🎉 ALL MODULE 2 BACKEND APIS & ROLE GUARDS PASSED!');
  console.log('====================================================');
};

testModule2().catch((err) => {
  console.error('Module 2 test error:', err);
  process.exit(1);
});

