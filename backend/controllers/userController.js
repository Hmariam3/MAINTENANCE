const prisma = require('../db');
const ldap = require('ldapjs');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        roles: true,
        branches: true
      }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { full_name, username, email, phone_number, role_id, branch_id } = req.body;

    if (!full_name || !username || !email || !role_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const newUser = await prisma.users.create({
      data: {
        full_name,
        username,
        email,
        phone_number,
        role_id: parseInt(role_id, 10),
        branch_id: branch_id ? parseInt(branch_id, 10) : null,
        is_active: true
      }
    });

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error(err);
    // Prisma unique constraint violation (e.g. username or email exists)
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.searchAdUser = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username query parameter is required' });
  }

  const client = ldap.createClient({
    url: process.env.LDAP_URL
  });

  client.on('error', (err) => {
    console.error('LDAP Client Error:', err);
  });

  try {
    await new Promise((resolve, reject) => {
      client.bind(process.env.LDAP_SERVICE_USER, process.env.LDAP_SERVICE_PASSWORD, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const searchOptions = {
      filter: `(|(sAMAccountName=${username})(mail=${username})(userPrincipalName=${username}))`,
      scope: 'sub',
      attributes: ['sAMAccountName', 'mail', 'displayName']
    };

    const adUser = await new Promise((resolve, reject) => {
      client.search(process.env.LDAP_BASE, searchOptions, (err, searchRes) => {
        if (err) return reject(err);

        let userFound = null;

        searchRes.on('searchEntry', (entry) => {
          if (!userFound) {
            userFound = entry.object;
          }
        });

        searchRes.on('error', (err) => {
          reject(err);
        });

        searchRes.on('end', (result) => {
          resolve(userFound);
        });
      });
    });

    client.unbind();

    if (!adUser) {
      return res.status(404).json({ error: 'User not found in Active Directory' });
    }

    res.json({
      username: adUser.sAMAccountName || '',
      email: adUser.mail || '',
      full_name: adUser.displayName || ''
    });

  } catch (error) {
    console.error('AD Search Error:', error);
    client.unbind();
    res.status(500).json({ error: 'Failed to search Active Directory' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, branch_id, phone_number, is_active } = req.body;

    const updatedUser = await prisma.users.update({
      where: { user_id: parseInt(id, 10) },
      data: {
        role_id: role_id ? parseInt(role_id, 10) : undefined,
        branch_id: branch_id ? parseInt(branch_id, 10) : undefined,
        phone_number: phone_number !== undefined ? phone_number : undefined,
        is_active: is_active !== undefined ? is_active : undefined
      }
    });

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Failed to update user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
