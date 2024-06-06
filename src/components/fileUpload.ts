import {
  WithResourceInfo,
  getPodUrlAll,
  overwriteFile,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";


/**
 * Fetches a logged-in user's Pod URLs using a webID.
 * 
 * @param webid The webID URL of the current user.
 * @returns A Promise that resolves to a string[] of user Pod URLs, if available, or `undefined` if no pods are found.
*/
async function getPodURLs(webid: string): Promise<string[]> {
  let pods: string[] = [];
  try {
    pods = await getPodUrlAll(webid, { fetch: fetch });
  } catch (error) {
    pods = ["Error: probably not logged in"];
  }
  return pods;
}

/**
 * Iterates through a FileList and uploads files to a Solid Pod via the uploadToPod() method.
 * 
 * @param fileList The list of files to be uploaded to the Pod.
 * @param podURL The URL of the Pod files are to be uploaded to.
*/
function handleFiles(fileList: FileList, podURL: string) {
  Array.from(fileList).forEach((file: File) => {
    uploadToPod(`${podURL}uploads/${file.name}`, file, fetch);
  });
}

/**
 * Takes in a File and upload is to a Solid Pod using the @inrupt/solid-client method overwriteFile().
 * 
 * The directory designated in targetURL does not need to exist before execuation.
 * The overwriteFile() method will create the conatiner (directory) path if it does not already exist.
 * 
 * @param targetURL The URL where the files are to be uploaded.
 * @param file The file that is to be uploaded to the Pod.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write access).
 * @returns A Promise that resolves to a string[] of user Pod URLs, if available, or `undefined` if no pods are found.
*/
async function uploadToPod(targetURL: string, file: File, fetch): Promise<boolean> {
  if (file.type != '') {
    // for if the file type is captured by the well-known "secret codes"
    try {
      const savedFile = await overwriteFile(targetURL, file, {
        contentType: file.type,
        fetch: fetch,
      });
      console.log(`File saved at ${targetURL}`);
      console.log(savedFile)
      return true
    } catch (error) {
      console.error(error);
    }
  } else {
    // for if the file type is not captured by the well-known "secret codes"
    try {
      const savedFile = await overwriteFile(targetURL, file, {
        fetch: fetch,
      });
      console.log(`File saved at ${targetURL}`);
      console.log(savedFile)
      return true
    } catch (error) {
      console.error(error);
    }
  }
}

export { handleFiles, getPodURLs };
