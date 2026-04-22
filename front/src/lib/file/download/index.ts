export type DownloadItem = {
  url: string
  fileName: string
}

export type BlobItem = {
  blob: Blob
  fileName: string
}

export function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

export function triggerDownload(url: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadFile(url: string, fileName: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`다운로드 실패 (HTTP ${res.status})`)
  const blob = await res.blob()
  saveBlob(blob, fileName)
}

function disambiguate(taken: Set<string>, name: string): string {
  if (!taken.has(name)) {
    taken.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let n = 2
  while (taken.has(`${base}-${n}${ext}`)) n++
  const unique = `${base}-${n}${ext}`
  taken.add(unique)
  return unique
}

export async function downloadAsZip(
  items: DownloadItem[],
  zipName: string,
): Promise<void> {
  if (items.length === 0) throw new Error('다운로드할 파일이 없습니다')

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const taken = new Set<string>()

  const blobs = await Promise.all(
    items.map(async ({ url, fileName }) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${fileName} 다운로드 실패 (HTTP ${res.status})`)
      return { blob: await res.blob(), fileName }
    }),
  )

  for (const { blob, fileName } of blobs) {
    zip.file(disambiguate(taken, fileName), blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveBlob(zipBlob, zipName)
}

export async function zipBlobs(items: BlobItem[], zipName: string): Promise<void> {
  if (items.length === 0) throw new Error('압축할 파일이 없습니다')

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const taken = new Set<string>()

  for (const { blob, fileName } of items) {
    zip.file(disambiguate(taken, fileName), blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveBlob(zipBlob, zipName)
}
