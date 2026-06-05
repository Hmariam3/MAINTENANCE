const { authenticate } = require('ldap-authentication');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 1. Bypass for Admin user
    if (username === 'Admin' && password === '123456') {
      let adminUser = await prisma.users.findUnique({ where: { username: 'Admin' } });
      if (!adminUser) {
        // Provide a default object if Admin doesn't exist in the DB yet,
        // though the user mentioned they created one.
        adminUser = { user_id: 0, username: 'Admin', role_id: 1, full_name: 'System Admin' };
      }
      const token = jwt.sign(
        { user_id: adminUser.user_id, username: adminUser.username, role_id: adminUser.role_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({ message: 'Admin login successful', token, user: adminUser });
    }

    // 2. Check if the user exists in the local database
    // The user mentioned they can login with email or username, so we check both
    let localUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    });

    if (!localUser || !localUser.is_active) {
      return res.status(401).json({ error: 'User not found or inactive in the local system. Contact Admin.' });
    }

    // 3. Authenticate with LDAP
    // If username is an email, extract the sAMAccountName part if necessary, 
    // but often we can just pass what they typed and let AD figure it out if we use direct bind.
    // However, since we have a service user, we will search for their DN first.
    let searchFilter = `(|(sAMAccountName=${username})(mail=${username})(userPrincipalName=${username}))`;
    
    let options = {
      ldapOpts: {
        url: process.env.LDAP_URL,
      },
      adminDn: process.env.LDAP_SERVICE_USER,
      adminPassword: process.env.LDAP_SERVICE_PASSWORD,
      userPassword: password,
      userSearchBase: process.env.LDAP_BASE,
      usernameAttribute: 'sAMAccountName', // fallback
      username: username,
      // If the library supports custom filter:
      // userSearchFilter: searchFilter
    };

    let ldapUser;
    try {
      ldapUser = await authenticate(options);
    } catch (ldapErr) {
      console.error('LDAP Auth Error:', ldapErr);
      return res.status(401).json({ error: 'Invalid LDAP credentials' });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { user_id: localUser.user_id, username: localUser.username, role_id: localUser.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ message: 'Login successful', token, user: localUser });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
