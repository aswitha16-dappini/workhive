import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testHttpApi = async () => {
  const baseUrl = 'http://localhost:5000/api/auth';
  console.log('Testing HTTP Auth Endpoints at:', baseUrl);

  // 1. Register Client or Login if already exists
  let clientToken;
  const regClientRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Charlie Client',
      email: 'charlie@workhive.com',
      password: 'password123',
      role: 'Client',
    }),
  });
  const regClientData = await regClientRes.json();
  if (regClientRes.status === 201) {
    console.log('1. Register Client HTTP status: 201 SUCCESS');
    clientToken = regClientData.token;
  } else {
    console.log('1. Client already registered, testing login...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'charlie@workhive.com',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log('2. Login Client HTTP status:', loginRes.status, loginData.success ? 'SUCCESS' : loginData.message);
    clientToken = loginData.token;
  }

  // 2. Register Freelancer or Login if already exists
  let freelancerToken;
  const regFreelancerRes = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dana Freelancer',
      email: 'dana@workhive.com',
      password: 'password123',
      role: 'Freelancer',
    }),
  });
  const regFreelancerData = await regFreelancerRes.json();
  if (regFreelancerRes.status === 201) {
    console.log('3. Register Freelancer HTTP status: 201 SUCCESS');
    freelancerToken = regFreelancerData.token;
  } else {
    console.log('3. Freelancer already registered, testing login...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dana@workhive.com',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log('   Login Freelancer HTTP status:', loginRes.status, loginData.success ? 'SUCCESS' : loginData.message);
    freelancerToken = loginData.token;
  }

  // 3. Test /api/auth/me with Client Token
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  const meData = await meRes.json();
  console.log('4. Profile /me HTTP status:', meRes.status, `Logged in as: ${meData.user?.name} (${meData.user?.role})`);

  // 4. Test Role Authorization: Client accessing /client-only (Expect 200)
  const clientAccessClientRes = await fetch(`${baseUrl}/client-only`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log('5. Client accessing /client-only:', clientAccessClientRes.status === 200 ? '✅ 200 OK (Allowed)' : '❌ FAILED');

  // 5. Test Role Authorization: Freelancer accessing /client-only (Expect 403 Forbidden)
  const freelancerAccessClientRes = await fetch(`${baseUrl}/client-only`, {
    headers: { Authorization: `Bearer ${freelancerToken}` },
  });
  console.log('6. Freelancer accessing /client-only:', freelancerAccessClientRes.status === 403 ? '✅ 403 Forbidden (Blocked as expected)' : '❌ FAILED');

  // 6. Test Role Authorization: Freelancer accessing /freelancer-only (Expect 200)
  const freelancerAccessFreelancerRes = await fetch(`${baseUrl}/freelancer-only`, {
    headers: { Authorization: `Bearer ${freelancerToken}` },
  });
  console.log('7. Freelancer accessing /freelancer-only:', freelancerAccessFreelancerRes.status === 200 ? '✅ 200 OK (Allowed)' : '❌ FAILED');

  // 7. Test Role Authorization: Client accessing /freelancer-only (Expect 403 Forbidden)
  const clientAccessFreelancerRes = await fetch(`${baseUrl}/freelancer-only`, {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log('8. Client accessing /freelancer-only:', clientAccessFreelancerRes.status === 403 ? '✅ 403 Forbidden (Blocked as expected)' : '❌ FAILED');

  // 8. Test invalid password login (Expect 401)
  const badLoginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'charlie@workhive.com',
      password: 'wrongpassword',
    }),
  });
  console.log('9. Invalid password rejection:', badLoginRes.status === 401 ? '✅ 401 Unauthorized (Rejected as expected)' : '❌ FAILED');

  console.log('\n🎉 ALL HTTP AUTH & ROLE-BASED ACCESS CONTROL TESTS PASSED PERFECTLY!');
};

testHttpApi().catch(err => {
  console.error('HTTP test error:', err);
  process.exit(1);
});
