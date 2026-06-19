const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 1. Bypass for Admin user
    if ((username === 'Admin' || username === 'requester' || username === 'supervisor' || username === 'helpdesk' || username === 'technician' || username === 'manager') && password === '123456') {
      let adminUser = await prisma.users.findUnique({ where: { username } });
      if (!adminUser) {
        adminUser = { user_id: 0, username: 'Admin', role_id: 1, full_name: 'System Admin' };
      }
      const token = jwt.sign(
        { user_id: adminUser.user_id, username: adminUser.username, role_id: adminUser.role_id, branch_id: adminUser.branch_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({ message: 'Admin login successful', token, user: adminUser });
    }

    // 2. Authenticate with External AD API
    const baseUrlLdap = process.env.EXTERNAL_AD_URL || process.env.LDAP_URL;
    let adRes;
    try {
      adRes = await axios.post(
        `${baseUrlLdap}`,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.EXTERNAL_AD_API_KEY,
          },
          timeout: 10000,
        }
      );
    } catch (err) {
      console.error('External AD API Error:', err.message);
      return res.status(401).json({ error: 'Invalid AD credentials or AD server unreachable' });
    }

    const adData = adRes.data;

    // Check if authenticated
    if (!adData.IsAuthenticated) {
      return res.status(401).json({ error: adData.ErrorMessage || 'Invalid AD credentials' });
    }

    // 3. Check if the user exists in the local database
    let localUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: adData.UserName || username },
          { email: adData.MailAdress || username }
        ]
      }
    });

    // 4. If user doesn't exist, prompt for profile setup
    if (!localUser) {
      const branches = await prisma.branches.findMany({ where: { is_active: true } });
      const tempToken = jwt.sign(
        { is_temp: true, username: adData.UserName || username },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return res.json({
        requires_profile: true,
        adUser: {
          username: adData.UserName || username,
          email: adData.MailAdress || '',
          full_name: adData.FullName || username
        },
        branches: branches,
        tempToken: tempToken
      });
    }

    if (!localUser.is_active) {
      return res.status(401).json({ error: 'User account is inactive. Contact Admin.' });
    }

    // 5. Generate JWT and Login
    const token = jwt.sign(
      { user_id: localUser.user_id, username: localUser.username, role_id: localUser.role_id, branch_id: localUser.branch_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ message: 'Login successful', token, user: localUser });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
