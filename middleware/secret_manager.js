import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const name = 'projects/577599183138/secrets/MAPS_API_KEY/versions/latest';

export async function getMapsAPIKey() {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload.data.toString();
    return payload;
}
