export type PresignRequestFile = {
  fileName: string
  fileSize: number
  contentType: string
}

export type PresignedUrlInfo = {
  url: string
  objectKey: string
  fileName: string
  bucket: string
  contentType: string
}

export type UploaderAdapter<Presign extends PresignedUrlInfo, Registered> = {
  requestPresignedUrls: (files: PresignRequestFile[]) => Promise<Presign[]>
  registerUploadedFiles: (
    uploaded: { presign: Presign; file: File }[],
  ) => Promise<Registered[]>
}

export type PresignedUploader<Registered> = {
  upload: (file: File) => Promise<Registered>
}
