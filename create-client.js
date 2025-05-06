// create-client.js
const axios = require('axios');

const keycloakUrl = process.env.KEYCLOAK_URL;
const realm = process.env.KEYCLOAK_REALM;
const adminUser = process.env.KEYCLOAK_ADMIN_USER;
const adminPass = process.env.KEYCLOAK_ADMIN_PASS;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

async function getAccessToken() {
  const url = `${keycloakUrl}/auth/realms/${realm}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', 'admin-cli');
  params.append('username', adminUser);
  params.append('password', adminPass);

  const response = await axios.post(url, params);
  return response.data.access_token;
}

async function createClient(token) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients`;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const clientData = {
    clientId,
    secret: clientSecret,
    enabled: true,
    protocol: "openid-connect",
    publicClient: false,
    serviceAccountsEnabled: true,
    standardFlowEnabled: false,
    directAccessGrantsEnabled: false
  };

  await axios.post(url, clientData, config);
  console.log(`✅ Client "${clientId}" created successfully.`);
}

(async () => {
  try {
    const token = await getAccessToken();
    await createClient(token);
  } catch (err) {
    console.error('❌ Error creating client:', err.response?.data || err.message);
    process.exit(1);
  }
})();
