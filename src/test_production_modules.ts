import { prisma } from './config/db';
import app from './app';

const PORT = 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

async function testSuite() {
  console.log('🧪 Starting Production-Grade Modules E2E Integration Test Suite...');
  
  // Reference app to ensure the module loader executes app.ts side-effects (server start)
  const isAppRunning = typeof app === 'function';
  console.log(`🚀 Checking Server initialization... ${isAppRunning ? 'Ready' : 'Failed'}`);

  // Wait for the app's server to listen
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`📡 Connecting to test server on port ${PORT}`);

  try {
    // ─────────────────────────────────────────────
    // Clean Database for fresh test run
    // ─────────────────────────────────────────────
    await prisma.notification.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.kycProfile.deleteMany();
    await prisma.userInvestment.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.user.deleteMany();

    const userEmail = 'testuser@gig.com';
    const userPassword = 'Password123!';
    const newPassword = 'NewPassword123!';
    const adminEmail = 'admin@gig.com';
    const adminPassword = 'AdminPassword123!';

    // Helper for requests
    async function request(path: string, options: any = {}): Promise<any> {
      const url = `${BASE_URL}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      };

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Request to ${path} failed (${res.status}): ${JSON.stringify(data)}`);
      }
      return data;
    }

    // ─────────────────────────────────────────────
    // 1. Register User & Admin
    // ─────────────────────────────────────────────
    console.log('\n📝 1. Testing Registration...');
    const userReg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Test User', email: userEmail, password: userPassword },
    });
    console.log('✅ User registered successfully:', userReg.data.user.email);

    const adminReg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Platform Admin', email: adminEmail, password: adminPassword },
    });
    console.log('✅ Admin registered successfully:', adminReg.data.user.email);

    // Promote admin email to ADMIN role in database
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    console.log('👑 Admin role granted to:', adminEmail);

    // Login as Admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword },
    });
    const adminToken = adminLogin.data.token;

    // ─────────────────────────────────────────────
    // 2. Email Verification Flow
    // ─────────────────────────────────────────────
    console.log('\n✉️ 2. Testing Email Verification...');
    
    // Login to get token first
    const userLoginInit = await request('/auth/login', {
      method: 'POST',
      body: { email: userEmail, password: userPassword },
    });
    const userTokenInit = userLoginInit.data.token;

    // Send email verification request
    const sendVerifyRes = await request('/auth/verify-email/request', {
      method: 'POST',
      token: userTokenInit,
    });
    const emailVerifyToken = sendVerifyRes.data.token;
    console.log('🔑 Generated verification token:', emailVerifyToken);

    // Verify email using token
    const verifyEmailRes = await request(`/auth/verify-email?token=${emailVerifyToken}`, {
      method: 'GET',
    });
    console.log('✅ Email verified:', verifyEmailRes.message);

    // Log in again as verified user
    const userLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: userEmail, password: userPassword },
    });
    let userToken = userLogin.data.token;
    console.log('✅ User logged in successfully. Token acquired.');

    // ─────────────────────────────────────────────
    // 3. Forgot & Reset Password Flow
    // ─────────────────────────────────────────────
    console.log('\n🔑 3. Testing Password Recovery...');
    const forgotRes = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: userEmail },
    });
    const resetToken = forgotRes.data.token;
    console.log('🔑 Generated reset token:', resetToken);

    const resetRes = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, newPassword },
    });
    console.log('✅ Password reset successful:', resetRes.message);

    // Login with new password
    const userLoginNew = await request('/auth/login', {
      method: 'POST',
      body: { email: userEmail, password: newPassword },
    });
    userToken = userLoginNew.data.token;
    console.log('✅ Logged in successfully with NEW password.');

    // ─────────────────────────────────────────────
    // 4. Link & Manage Payment Methods
    // ─────────────────────────────────────────────
    console.log('\n💳 4. Testing Payment Methods...');
    const cardPm = await request('/payment-methods', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'CARD',
        provider: 'Visa',
        last4: '4242',
      },
    });
    console.log('✅ Payment Method (Card) linked:', cardPm.data.paymentMethod.id);

    const bankPm = await request('/payment-methods', {
      method: 'POST',
      token: userToken,
      body: {
        type: 'BANK_ACCOUNT',
        provider: 'Chase Bank',
        last4: '7890',
      },
    });
    console.log('✅ Payment Method (Bank) linked:', bankPm.data.paymentMethod.id);

    const pms = await request('/payment-methods', {
      token: userToken,
    });
    console.log(`✅ Fetched linked payment methods. Total: ${pms.data.paymentMethods.length}`);
    if (pms.data.paymentMethods.length !== 2) throw new Error('Expected 2 payment methods linked.');

    // Delete one payment method
    await request(`/payment-methods/${cardPm.data.paymentMethod.id}`, {
      method: 'DELETE',
      token: userToken,
    });
    console.log('✅ Payment Method (Card) deleted.');

    const pmsAfterDelete = await request('/payment-methods', {
      token: userToken,
    });
    console.log(`✅ Fetched payment methods after deletion. Total: ${pmsAfterDelete.data.paymentMethods.length}`);
    if (pmsAfterDelete.data.paymentMethods.length !== 1) throw new Error('Expected 1 payment method remaining.');

    // ─────────────────────────────────────────────
    // 5. KYC Submission & Administrative Review
    // ─────────────────────────────────────────────
    console.log('\n🆔 5. Testing KYC flow...');
    const kycSubmit = await request('/kyc/submit', {
      method: 'POST',
      token: userToken,
      body: {
        fullName: 'Test User Identity',
        address: '123 Wall Street, New York, NY 10005',
        dateOfBirth: '1990-01-01',
        idNumber: '123456789',
        idDocumentUrl: 'https://gig-storage.com/docs/passport-front.jpg',
      },
    });
    console.log('✅ KYC Profile submitted. Initial Status:', kycSubmit.data.kyc.status);

    const kycStatusUser = await request('/kyc/status', {
      token: userToken,
    });
    console.log('✅ User retrieved KYC status:', kycStatusUser.data.status);
    if (kycStatusUser.data.status !== 'PENDING') throw new Error('Expected status PENDING.');

    // Admin approves KYC profile
    const kycApprove = await request(`/kyc/review/${userLogin.data.user.id}`, {
      method: 'PATCH',
      token: adminToken,
      body: {
        status: 'APPROVED',
      },
    });
    console.log('✅ Admin approved KYC profile. Final Status:', kycApprove.data.kyc.status);

    const kycStatusUserApproved = await request('/kyc/status', {
      token: userToken,
    });
    console.log('✅ User retrieved KYC status after review:', kycStatusUserApproved.data.status);
    if (kycStatusUserApproved.data.status !== 'APPROVED') throw new Error('Expected status APPROVED.');

    // ─────────────────────────────────────────────
    // 6. Deposits & In-App Notification triggers
    // ─────────────────────────────────────────────
    console.log('\n🔔 6. Testing Wallet Deposit & Notifications...');
    const depositRes = await request('/transactions/deposit', {
      method: 'POST',
      token: userToken,
      body: { amount: 500.0 },
    });
    console.log(`✅ Deposited $500. New Balance: $${depositRes.data.newBalance}`);

    // Wait a brief moment for async notification creation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch user notifications
    const notifications = await request('/notifications', {
      token: userToken,
    });
    console.log(`✅ Retrieved notifications. Count: ${notifications.data.length}`);
    const latestNotif = notifications.data[0];
    console.log('📣 Latest notification:', latestNotif.title, '-', latestNotif.message);
    if (latestNotif.title !== 'Deposit Successful') {
      throw new Error(`Expected 'Deposit Successful' notification, got: ${latestNotif.title}`);
    }

    // Mark single notification read
    const markReadRes = await request(`/notifications/${latestNotif.id}/read`, {
      method: 'PATCH',
      token: userToken,
    });
    console.log('✅ Notification marked read:', markReadRes.data.notification.read);

    // Mark all read
    const markAllReadRes = await request('/notifications/read-all', {
      method: 'PATCH',
      token: userToken,
    });
    console.log('✅ All notifications marked read. Response message:', markAllReadRes.message);

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST SUITE FAILED:', error);
    process.exit(1);
  }
}

testSuite();
