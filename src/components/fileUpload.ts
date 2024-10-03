import {
  WithResourceInfo,
  overwriteFile,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import { mimeTypes } from "./mime_types.js";

/**
 * Iterates through a FileList and uploads files to a Solid Pod via the uploadToPod() method.
 *
 * @param fileList The list of files to be uploaded to the Pod.
 * @param podURL The URL of the Pod files are to be uploaded to.
 */
export async function handleFiles(fileList: FileList, podURL: string): Promise<string[]> {
  const outputList: string[] = [];
  console.log(podURL);
  for (let i = 0; i < fileList.length; i++) {
    const upload: string = await uploadToPod(`${podURL}uploads/${fileList[i].name}`, fileList[i], fetch);
    outputList.push(upload);
  }
  // console.log(outputList)
  return outputList;
}

/**
 * Converts a file extension into a MIME Type for use in HTTP PUT requests.
 * The function relies on the hash map contained in the file 'mime_types.js'.
 *
 * @param fileExtension The file extension string of the file for which the MIME Type should be found.
 * @returns The MIME Type string of the file of interest or 'application/octet-stream' if not in the hash map.
 */
export function getMimeType(fileExtension: string) {
  return mimeTypes[fileExtension.toLowerCase()] || "application/octet-stream";
}

/**
 * Takes in a File and uploads it to a Solid Pod using the @inrupt/solid-client method overwriteFile().
 *
 * The directory designated in targetURL does not need to exist before execuation.
 * The contentType of the uploaded file is determined by the getMineType() method using the file's extension.
 * The overwriteFile() method will create the conatiner (directory) path if it does not already exist.
 *
 * @param targetURL The URL where the files are to be uploaded.
 * @param file The file that is to be uploaded to the Pod.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write access).
 * @returns A Promise that resolves to a File & WithResourceInfo of the uploaded files.
 */
async function uploadToPod(
  targetURL: string,
  file: File,
  fetch
): Promise<string> {
  try {
    const savedFile: File & WithResourceInfo = await overwriteFile(targetURL, file, {
      contentType: getMimeType('.' + file.name.split('.')[file.name.split('.').length - 1]),
      fetch: fetch,
    });
    // console.log(`File saved at ${targetURL}`);
    // console.log(savedFile); // Type of this file is <File & WithResourceInfo>
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(error);
    return "error";
  }
}

/**
 * Checks if the files uploaded from submitUpload() have .name properties (which proves upload was success).
 * 
 * @param uploadedFiles is a list of files obtained from the upload process
 * 
 * @returns a boolean value that indicated if the file uploads have been successful or not
 */
export function uploadSuccess(uploadedFiles: string[]): boolean {
  let success = false;
  uploadedFiles.forEach((up: string) => {
    console.log(up)
    if (up !== undefined || up !== 'error') {
      success = true
    } else {
      success = false
    }
  });
  return success
}

/**
 * Function that returns different bits of information about a file
 * 
 * @param inputFile the file that info is to be determined from
 * 
 * @returns the file NAME, the file SIZE, and the file's URI (URL)
 */
export function derefrenceFile(inputFile: File & WithResourceInfo): string[] {
  try {
    return [inputFile.name, String(inputFile.size), inputFile.internal_resourceInfo.sourceIri]
  } catch (error) {
    console.error('Error', error)
    return ["error"];
  }
}
