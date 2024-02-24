import { saveFileInContainer, WithResourceInfo } from '@inrupt/solid-client';
import { fetch } from "@inrupt/solid-client-authn-browser";

export async function uploadFile(file: File): Promise<void> {
    // Replace 'https://your-pod.solidcommunity.net/public/' with the URL of your container
    const savedFile = await saveFileInContainer('http://localhost:3000', file, { fetch: window.fetch }) as File & WithResourceInfo;
    console.log(`Saved ${savedFile.url}`);
}