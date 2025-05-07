const axios = require('axios');
const fs = require('fs');
const path = require('path');

const keycloakUrl = process.env.KEYCLOAK_URL;
const realm = process.env.KEYCLOAK_REALM;
const adminUser = process.env.KEYCLOAK_ADMIN_USER;
const adminPass = process.env.KEYCLOAK_ADMIN_PASS;

const openshiftApi = process.env.OPENSHIFT_API_URL;
const openshiftNamespace = process.env.OPENSHIFT_NAMESPACE;
const openshiftToken = process.env.OPENSHIFT_TOKEN;

const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'clients.json'), 'utf8'));

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

async function getClientCredentials(token, clientId) {
  const headers = { Authorization: `Bearer ${token}` };
  const searchUrl = `${keycloakUrl}/auth/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`;
  const clientResp = await axios.get(searchUrl, { headers });

  if (!clientResp.data.length) throw new Error(`Client "${clientId}" not found`);

  const client = clientResp.data[0];
  const secretUrl = `${keycloakUrl}/auth/admin/realms/${realm}/clients/${client.id}/client-secret`;
  const secretResp = await axios.get(secretUrl, { headers });

  return {
    clientId: client.clientId,
    secret: secretResp.data.value
  };
}

async function createK8sSecret({ clientId, secret }) {
  const url = `${openshiftApi}/api/v1/namespaces/${openshiftNamespace}/secrets`;
  const headers = {
    Authorization: `Bearer ${openshiftToken}`,
    'Content-Type': 'application/json'
  };

  const secretName = `${clientId}-secret`;
  const clientIdKey = `${clientId}-NAME`.toUpperCase().replace('-', '_');
  const clientSecretKey = `${clientId}-SECRET`.toUpperCase().replace('-', '_');

  console.log(`Replaced Client ID: "${clientIdKey}"`);

  const payload = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: secretName
    },
    type: 'Opaque',
    data: {
      [`${clientIdKey}`]: Buffer.from(clientId).toString('base64'),
      [`${clientSecretKey}`]: Buffer.from(secret).toString('base64')
    }
  };

  try {
    await axios.post(url, payload, { headers });
    console.log(`✅ Secret "${secretName}" created.`);
  } catch (err) {
    if (err.response?.status === 409) {
      console.log(`🔁 Secret "${secretName}" already exists. Replacing...`);
      await axios.put(`${url}/${secretName}`, payload, { headers });
    } else {
      console.error(`❌ Failed to create secret for "${clientId}":`, err.message);
    }
  }
}

(async () => {
  try {
    const kcToken = await getAccessToken();

    for (const clientId of config.clients) {
      console.log(`🔍 Fetching secret for "${clientId}"...`);
      const creds = await getClientCredentials(kcToken, clientId);
      await createK8sSecret(creds);
    }

    console.log('🎉 All secrets processed.');
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
})();
