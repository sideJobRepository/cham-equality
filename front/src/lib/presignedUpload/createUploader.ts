import axios from 'axios'
import type {
  PresignedUploader,
  PresignedUrlInfo,
  UploaderAdapter,
} from './types'

async function defaultPutToRemote(url: string, file: File): Promise<void> {
  await axios.put(url, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    transformRequest: [(d) => d],
  })
}

export function createPresignedUploader<
  Presign extends PresignedUrlInfo,
  Registered,
>(adapter: UploaderAdapter<Presign, Registered>): PresignedUploader<Registered> {
  const put = adapter.putToRemote ?? defaultPutToRemote

  async function uploadMany(files: File[]): Promise<Registered[]> {
    if (files.length === 0) return []

    const presigns = await adapter.requestPresignedUrls(
      files.map((f) => ({
        fileName: f.name,
        fileSize: f.size,
        contentType: f.type,
      })),
    )
    if (presigns.length !== files.length) {
      throw new Error('presigned URL 응답 개수가 요청과 일치하지 않습니다')
    }

    await Promise.all(presigns.map((p, i) => put(p.url, files[i])))

    return adapter.registerUploadedFiles(
      presigns.map((presign, i) => ({ presign, file: files[i] })),
    )
  }

  async function upload(file: File): Promise<Registered> {
    const [result] = await uploadMany([file])
    return result
  }

  return { upload, uploadMany }
}
