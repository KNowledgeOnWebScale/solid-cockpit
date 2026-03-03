import {
  WithResourceInfo,
  overwriteFile,
  saveFileInContainer,
  createContainerAt,
  getSolidDataset,
  saveSolidDatasetAt,
  getResourceInfo,
  getThing,
  removeThing,
  deleteFile,
  deleteSolidDataset,
  getContainedResourceUrlAll,
  getUrlAll,
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import {
  getMimeType,
  alreadyExistsCheck,
  uploadSuccess,
  derefrenceFile,
} from "./fileUploadUtils";

export { getMimeType, alreadyExistsCheck, uploadSuccess, derefrenceFile };

/**
 * Iterates through a FileList and uploads files to a Solid Pod via the uploadToPod() inrupt method.
 *
 * @param fileList The list of files to be uploaded to the Pod.
 * @param uploadPath The URL path to the specified upload container.
 * @param podURL The URL of the Pod files are to be uploaded to.
 *
 * @returns a list of file names that have been uploaded.
 */
export async function handleFiles(
  fileList: FileList,
  uploadPath: string,
  podURL: string
): Promise<string[]> {
  const outputList: string[] = [];
  await ensureDirectoriesExist(podURL, uploadPath, fetch);
  for (let i = 0; i < fileList.length; i++) {
    if (await alreadyExists(fileList[i], uploadPath)) {
      outputList.push(`already exists`);
    } else {
      const upload: string = await uploadToPod(
        `${uploadPath}`,
        fileList[i],
        fetch
      );
      outputList.push(upload);
    }
  }
  return outputList;
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
async function overwriteToPod(
  targetURL: string,
  file: File,
  fetch
): Promise<string> {
  try {
    const savedFile: File & WithResourceInfo = await overwriteFile(
      targetURL,
      file,
      {
        contentType: getMimeType(
          "." + file.name.split(".")[file.name.split(".").length - 1]
        ),
        fetch: fetch,
      }
    );
    // console.log(`File saved at ${targetURL}`);
    // console.log(savedFile); // Type of this file is <File & WithResourceInfo>
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    console.error(error);
    return "error";
  }
}

/**
 * Deletes a file from a Solid Pod using the @inrupt/solid-client method deleteFile().
 *
 * @param fileUrl The URL of the file to be deleted.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write/Delete access).
 * @returns A Promise that resolves to a boolean indicating whether the deletion was successful.
 */
export async function deleteFromPod(fileUrl: string): Promise<boolean> {
  try {
    await deleteFile(fileUrl, { fetch });
    return true;
  } catch (error) {
    console.error(`Error deleting ${fileUrl}:`, error);
    return false;
  }
}

/**
 * Deletes a file from a Solid Pod using the @inrupt/solid-client method deleteFile().
 *
 * @param fileUrl The URL of the file to be deleted.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write/Delete access).
 * @returns A Promise that resolves to a boolean indicating whether the deletion was successful.
 */
export async function deleteContainer(containerUrl: string): Promise<boolean> {
  try {
    const containerDataset = await getSolidDataset(containerUrl, { fetch });
    const containedResources = getContainedResourceUrlAll(containerDataset);

    for (const resourceUrl of containedResources) {
      await deleteFile(resourceUrl, { fetch });
    }

    await deleteSolidDataset(containerUrl, { fetch });
    return true;
  } catch (error) {
    console.error(`Error deleting ${containerUrl}:`, error);
    return false;
  }
}

/**
 * Deletes a Query Hash Thing from queries.ttl file using the @inrupt/solid-client method removeThing().
 *
 * @param queriesttlUrl The URL of the file to be deleted.
 * @param targetHash The hash of the Query Thing to be deleted.
 * @returns A Promise that resolves to a boolean indicating whether the deletion was successful.
 */
export async function deleteThing(
  queriesttlUrl: string,
  targetHash: string
): Promise<boolean> {
  const SD_ENDPOINT =
    "http://www.w3.org/ns/sparql-service-description#endpoint";
  const removalTarget = `${queriesttlUrl}#${targetHash}`;
  try {
    let dataset = await getSolidDataset(removalTarget, { fetch });

    // Get the sources Thing from the desired query and delete it
    const entry = getThing(dataset, removalTarget);
    const endpointUrls = getUrlAll(entry, SD_ENDPOINT);
    let removed = dataset;
    console.log(removed);
    if (endpointUrls.length != 0) {
      for (const oUrl of endpointUrls) {
        // a) Remove the object URL from the entry’s sd:endpoint values
        removed = removeThing(removed, oUrl);
      }
    }

    // delete the hash Thing
    removed = removeThing(removed, removalTarget);
    console.log(removed);
    await saveSolidDatasetAt(queriesttlUrl, removed, { fetch });

    return true;
  } catch (error) {
    console.log(`Error deleting ${removalTarget}`);
    return false;
  }
}

/**
 * Takes in a File and uploads it to a Solid Pod using the @inrupt/solid-client method saveFileInContainer().
 *
 * The directory designated in targetURL does not need to exist before execuation.
 * The contentType of the uploaded file is determined by the getMineType() method using the file's extension.
 * The overwriteFile() method will create the conatiner (directory) path if it does not already exist.
 *
 * @param targetURL The container URL where the files are to be uploaded.
 * @param file The file that is to be uploaded to the Pod.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write access).
 * @returns A Promise that resolves to a File & WithResourceInfo of the uploaded files.
 */
async function uploadToPod(
  containerUrl: string,
  file: File,
  fetch
): Promise<string> {
  try {
    const savedFile: File & WithResourceInfo = await saveFileInContainer(
      containerUrl,
      file,
      {
        contentType: getMimeType(
          "." + file.name.split(".")[file.name.split(".").length - 1]
        ),
        fetch: fetch,
      }
    );
    // console.log(`File saved at ${targetURL}`);
    // console.log(savedFile); // Type of this file is <File & WithResourceInfo>
    return savedFile.internal_resourceInfo.sourceIri;
  } catch (error) {
    // console.error(error);
    return "error";
  }
}

/**
 * Iterates through specified file upload path and creates containers in pod if they do not already exist.
 *
 * @param basePodUrl The container URL where the files are to be uploaded.
 * @param uploadUrl The file that is to be uploaded to the Pod.
 * @param fetch A window.fetch that includes the current User's credentials (to allow for Write access).
 */
async function ensureDirectoriesExist(
  basePodUrl: string,
  uploadUrl: string,
  fetch
): Promise<void> {
  // Convert URLs to directory paths
  const baseURL = new URL(basePodUrl);
  const uploadURL = new URL(uploadUrl);
  if (!uploadURL.href.startsWith(baseURL.href)) {
    console.error("Input URL must be inside the base pod URL.");
    return;
  }
  if (uploadURL.href == baseURL.href) {
    return;
  }
  // Extract directories in descending order (closest to base pod first)
  const np = uploadUrl.split(basePodUrl)[1].split("/");
  const directories = np.slice(0, -1);
  let currentUrl = basePodUrl;
  for (let i = 0; i < directories.length; i++) {
    // handles deep directory structure
    try {
      // Check if directory exists
      const result = await getResourceInfo(`${currentUrl}${directories[i]}/`, {
        fetch: fetch,
      });
    } catch (error) {
      if (error.statusCode === 404) {
        // console.log(`Creating directory: ${directories[i]}`);
        await createContainerAt(`${currentUrl}${directories[i]}/`, {
          fetch: fetch,
        });
      } else {
        console.error(`Error creating directory ${directories[i]}:`, error);
      }
    }
    currentUrl = `${currentUrl}${directories[i]}/`;
  }
}

/**
 * Takes in a file name and returns whether it already exists within the specified Pod container.
 *
 * @param file The container URL where the files are to be uploaded.
 * @param uploadUrl The file that is to be uploaded to the Pod.
 *
 * @return A boolean representing whether the file to be uploaded alreay exists in the current directory
 */
export async function alreadyExists(
  file: File,
  uploadUrl: string
): Promise<boolean> {
  // const containerContents = await fetchData(uploadUrl);
  try {
    const containerContents = await getSolidDataset(uploadUrl, { fetch });
    const containedUrls = getContainedResourceUrlAll(containerContents);

    // See if it exists in the list
    if (containedUrls.includes(uploadUrl + file.name)) {
      console.log("Found a match!");
      return true;
    } else {
      console.log("No match found.");
      return false;
    }
  } catch (e) {
    // console.log(`${uploadUrl}${file.name} does not yet exist, uploading now.`)
    return false;
  }
}
