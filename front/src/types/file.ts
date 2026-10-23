// /presigned-url, /upload-file 응답 타입. fileType(CONTENT_IMAGE 등)과 무관하게 모양이 같아 공용으로 둔다.

export type PresignedUrlResponse = {
  url: string
  objectKey: string
  fileName: string
  bucketName: string
  contentType: string
}

export type FileUploadResponse = {
  fileId: number
  fileName: string
  fileSize: number
  contentType: string
  objectKey: string
  bucketName: string
}
