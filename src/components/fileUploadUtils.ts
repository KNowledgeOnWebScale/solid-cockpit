import { WithResourceInfo } from "@inrupt/solid-client";
import { mimeTypes } from "./mime_types.js";

/**
 * Converts a file extension into a MIME Type for use in HTTP requests.
 *
 * @param fileExtension The file extension string of the file for which the MIME Type should be found.
 * @returns The MIME Type string of the file of interest or "application/octet-stream" if not in the hash map.
 */
export function getMimeType(fileExtension: string): string {
  return mimeTypes[fileExtension.toLowerCase()] || "application/octet-stream";
}

/**
 * Checks whether an upload result indicates that the file already exists.
 *
 * @param uploadMessage Upload result text
 * @returns true when the upload message equals "already exists", false otherwise.
 */
export function alreadyExistsCheck(uploadMessage: string): boolean {
  return uploadMessage === "already exists";
}

/**
 * Checks whether all uploaded file status values indicate success.
 *
 * @param uploadedFiles list of upload result strings
 * @returns true if every item is a non-error string and the list is non-empty.
 */
export function uploadSuccess(uploadedFiles: string[]): boolean {
  if (uploadedFiles.length === 0) {
    return false;
  }

  return uploadedFiles.every((up) => up !== undefined && up !== "error");
}

/**
 * Function that returns different bits of information about a file.
 *
 * @param inputFile the file that info is to be determined from
 * @returns the file NAME, the file SIZE, and the file's URI (URL)
 */
export function derefrenceFile(inputFile: File & WithResourceInfo): string[] {
  try {
    return [
      inputFile.name,
      String(inputFile.size),
      inputFile.internal_resourceInfo.sourceIri,
    ];
  } catch (error) {
    console.error("Error", error);
    return ["error"];
  }
}
