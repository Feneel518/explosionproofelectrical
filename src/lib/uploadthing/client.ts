import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import { FileRouter } from "uploadthing/next";

export const UploadButton = generateUploadButton<FileRouter>();
export const UploadDropzone = generateUploadDropzone<FileRouter>();
