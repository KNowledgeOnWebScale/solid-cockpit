import { saveFileInContainer, WithResourceInfo, getPodUrlAll, WebId } from '@inrupt/solid-client';
import { fetch, getDefaultSession } from "@inrupt/solid-client-authn-browser";


async function uploadFile(url:string, file: File): Promise<void> {
    const savedFile = await saveFileInContainer(
        url, file, { fetch: fetch }) as File & WithResourceInfo;
    console.log(`Saved ${savedFile}`);
}

async function checkFilesInPod() {
    // Use the Solid JavaScript Client to fetch the files
    
}

export { uploadFile }