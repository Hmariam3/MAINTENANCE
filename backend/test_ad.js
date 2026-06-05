require('dotenv').config();
const ldap = require('ldapjs');

async function testAD() {
  const username = 'testuser'; // Just a test value
  console.log('Connecting to', process.env.LDAP_URL);
  
  const client = ldap.createClient({
    url: process.env.LDAP_URL
  });

  client.on('error', (err) => {
    console.error('LDAP Client Error Event:', err);
  });

  try {
    await new Promise((resolve, reject) => {
      console.log('Binding with user:', process.env.LDAP_SERVICE_USER);
      client.bind(process.env.LDAP_SERVICE_USER, process.env.LDAP_SERVICE_PASSWORD, (err) => {
        if (err) return reject(err);
        console.log('Bind successful');
        resolve();
      });
    });

    const searchOptions = {
      filter: `(|(sAMAccountName=${username})(mail=${username})(userPrincipalName=${username}))`,
      scope: 'sub',
      attributes: ['sAMAccountName', 'mail', 'displayName']
    };

    console.log('Searching in base:', process.env.LDAP_BASE);
    const adUser = await new Promise((resolve, reject) => {
      client.search(process.env.LDAP_BASE, searchOptions, (err, searchRes) => {
        if (err) return reject(err);

        let userFound = null;

        searchRes.on('searchEntry', (entry) => {
          console.log('Found entry:', entry.object);
          if (!userFound) {
            userFound = entry.object;
          }
        });

        searchRes.on('error', (err) => {
          console.error('Search error event:', err);
          reject(err);
        });

        searchRes.on('end', (result) => {
          console.log('Search ended');
          resolve(userFound);
        });
      });
    });

    console.log('AD User:', adUser);
    client.unbind();

  } catch (error) {
    console.error('AD Search Error Caught:', error);
    client.unbind();
  }
}

testAD();
