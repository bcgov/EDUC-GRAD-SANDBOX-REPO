const axios = require('axios');

const keycloakUrl = process.env.KEYCLOAK_URL;
const realm = process.env.KEYCLOAK_REALM;
const adminUser = process.env.KEYCLOAK_ADMIN_USER;
const adminPass = process.env.KEYCLOAK_ADMIN_PASS;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const scopes = process.env.CLIENT_SCOPES?.split(',') || [];

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

async function getClientByClientId(token) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`;
  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(url, { headers });

  return response.data.length > 0 ? response.data[0] : null;
}

async function createClient(token) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
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

  const response = await axios.post(url, clientData, { headers });
  return response.headers.location.split('/').pop(); // return created client ID
}

async function updateClient(token, client) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients/${client.id}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const updatedData = {
    ...client,
    secret: clientSecret,
    enabled: true,
    publicClient: false,
    serviceAccountsEnabled: true,
    standardFlowEnabled: false,
    directAccessGrantsEnabled: false
  };

  await axios.put(url, updatedData, { headers });
}

async function assignScopes(token, clientId) {
  const headers = { Authorization: `Bearer ${token}` };

  // Get available client scopes
  const scopesUrl = `${keycloakUrl}/auth/admin/realms/${realm}/client-scopes`;
  const scopeList = await axios.get(scopesUrl, { headers });

  for (const scopeName of scopes) {
    const scope = scopeList.data.find(s => s.name === scopeName.trim());
    if (!scope) {
      console.warn(`⚠️ Scope "${scopeName}" not found. Skipping.`);
      continue;
    }

    const assignUrl = `${keycloakUrl}/auth/admin/realms/${realm}/clients/${clientId}/default-client-scopes/${scope.id}`;
    try {
      await axios.put(assignUrl, null, { headers });
      console.log(`✅ Assigned scope "${scopeName}" to client.`);
    } catch (err) {
      if (err.response?.status === 409) {
        console.log(`ℹ️ Scope "${scopeName}" already assigned.`);
      } else {
        console.error(`❌ Failed to assign scope "${scopeName}":`, err.message);
      }
    }
  }
}

(async () => {
  try {
    const token = await getAccessToken();

    let client = await getClientByClientId(token);
    let clientIdValue;

    if (client) {
      console.log(`ℹ️ Client "${clientId}" exists. Updating...`);
      await updateClient(token, client);
      clientIdValue = client.id;
    } else {
      console.log(`➕ Creating client "${clientId}"...`);
      clientIdValue = await createClient(token);
    }

    if (scopes.length > 0) {
      await assignScopes(token, clientIdValue);
    }

    console.log(`✅ Done.`);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
