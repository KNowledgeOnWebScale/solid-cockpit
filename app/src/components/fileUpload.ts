import {
  saveFileInContainer,
  WithResourceInfo,
  getPodUrlAll,
} from "@inrupt/solid-client";
import { getDefaultSession, fetch } from "@inrupt/solid-client-authn-browser";

async function getPodURLs(): Promise<string[]> {
    const webid: string = getDefaultSession().info.webId as string;
    const pods = await getPodUrlAll(webid, { fetch: fetch });
    return pods
}

async function uploadFile(url: string, file: File): Promise<void> {
  const savedFile = await saveFileInContainer(url, file, 
    { slug: file.name, contentType: file.type, fetch: fetch });
  console.log(`Saved ${savedFile}`);
}

async function checkFilesInPod() {
  // Use the Solid JavaScript Client to fetch the files
}

export { uploadFile, getPodURLs };
