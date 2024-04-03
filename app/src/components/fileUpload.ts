import {
  saveFileInContainer,
  WithResourceInfo,
  getPodUrlAll,
  getWebIdDataset,
  overwriteFile,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";

async function getPodURLs(webid: string): Promise<string[]> {
  let pods: string[] = [];
  try {
    pods = await getPodUrlAll(webid, { fetch: fetch });
  } catch (error) {
    pods = ["Error: probably not logged in"];
  }
  return pods;
}

function handleFiles(fileList: FileList, podURL: string) {
  Array.from(fileList).forEach((file: File) => {
    uploadToPod(`${podURL}uploads/${file.name}`, file, fetch);
  });
}

async function uploadToPod(targetURL: string, file: File, fetch): Promise<void> {
  try {
    const savedFile = await overwriteFile(targetURL, file, {
      contentType: file.type,
      fetch: fetch,
    });
    console.log(savedFile)
    console.log(`File saved at ${targetURL + file.name}`);
  } catch (error) {
    console.error(error);
  }
}

async function checkFilesInPod() {
  // Use the Solid JavaScript Client to fetch the files
}

export { handleFiles, getPodURLs };
