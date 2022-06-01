import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

const map_secret_name = 'projects/577599183138/secrets/MAPS_API_KEY/versions/latest';
const directions_secret_name = 'projects/577599183138/secrets/DIRECTIONS_API_KEY/versions/latest';

export async function getMapsAPIKey() {
    const [version] = await client.accessSecretVersion({ name: map_secret_name });
    const payload = version.payload.data.toString();
    return payload;
}

export async function getDirectionsAPIKey() {
    const [version] = await client.accessSecretVersion({ name: directions_secret_name });
    const payload = version.payload.data.toString();
    return payload;
}