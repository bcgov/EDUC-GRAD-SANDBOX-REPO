const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.resolve(__dirname, 'clients-config.json');
const clients = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const keycloakUrl = process.env.KEYCLOAK_URL;
const realm = process.env.KEYCLOAK_REALM;
const adminUser = process.env.KEYCLOAK_ADMIN_USER;
const adminPass = process.env.KEYCLOAK_ADMIN_PASS;

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

async function getClientByClientId(token, clientId) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`;
  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.get(url, { headers });

  return response.data.length > 0 ? response.data[0] : null;
}

async function createClient(token, client) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const data = {
    clientId: client.clientId,
    secret: client.secret,
    ...client.settings
  };

  const response = await axios.post(url, data, { headers });
  return response.headers.location.split('/').pop();
}

async function updateClient(token, existingClient, client) {
  const url = `${keycloakUrl}/auth/admin/realms/${realm}/clients/${existingClient.id}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const updatedData = {
    ...existingClient,
    secret: client.secret,
    ...client.settings
  };

  await axios.put(url, updatedData, { headers });
}

async function ensureScopeExists(token, scopeName) {
  const headers = { Authorization: `Bearer ${token}` };
  const scopesUrl = `${keycloakUrl}/auth/admin/realms/${realm}/client-scopes`;

  const response = await axios.get(scopesUrl, { headers });
  let scope = response.data.find(s => s.name === scopeName.trim());

  if (!scope) {
    console.log(`➕ Creating missing scope "${scopeName}"...`);
    await axios.post(scopesUrl, {
      name: scopeName,
      protocol: "openid-connect",
      attributes: {
        "include.in.token.scope": "true",
        "display.on.consent.screen": "true"
      }
    }, { headers });

    const updatedList = await axios.get(scopesUrl, { headers });
    scope = updatedList.data.find(s => s.name === scopeName.trim());
  }

  return scope;
}

async function assignScopes(token, clientId, scopeNames) {
  const headers = { Authorization: `Bearer ${token}` };

  for (const scopeName of scopeNames || []) {
    const scope = await ensureScopeExists(token, scopeName);
    if (!scope) continue;

    const assignUrl = `${keycloakUrl}/auth/admin/realms/${realm}/clients/${clientId}/default-client-scopes/${scope.id}`;
    try {
      await axios.put(assignUrl, null, { headers });
      console.log(`✅ Assigned scope "${scope.name}" to client.`);
    } catch (err) {
      if (err.response?.status === 409) {
        console.log(`ℹ️ Scope "${scope.name}" already assigned.`);
      } else {
        console.error(`❌ Failed to assign scope "${scope.name}":`, err.message);
      }
    }
  }
}

(async () => {
  try {
    const token = await getAccessToken();

    for (const client of clients) {
      console.log(`🚀 Processing client "${client.clientId}"...`);
      let existingClient = await getClientByClientId(token, client.clientId);
      let clientIdValue;

      if (existingClient) {
        await updateClient(token, existingClient, client);
        clientIdValue = existingClient.id;
        console.log(`🔄 Updated client "${client.clientId}".`);
      } else {
        clientIdValue = await createClient(token, client);
        console.log(`➕ Created client "${client.clientId}".`);
      }

      await assignScopes(token, clientIdValue, client.scopes);
    }

    console.log(`✅ All clients processed.`);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
