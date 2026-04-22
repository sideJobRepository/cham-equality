import axios from 'axios'
import type {
  PresignedUploader,
  PresignedUrlInfo,
  UploaderAdapter,
} from './types'

export function createPresignedUploader<
  Presign extends PresignedUrlInfo,
  Registered,
>(adapter: UploaderAdapter<Presign, Registered>): PresignedUploader<Registered> {
  async function upload(file: File): Promise<Registered> {
    const [presign] = await adapter.requestPresignedUrls([
      { fileName: file.name, fileSize: file.size, contentType: file.type },
    ])
    if (!presign) {
      throw new Error('presigned URL 응답이 비어 있습니다')
    }

    await axios.put(presign.url, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      transformRequest: [(d) => d],
    })

    const [registered] = await adapter.registerUploadedFiles([{ presign, file }])
    return registered
  }

  return { upload }
}
