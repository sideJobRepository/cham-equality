import api from '../lib/axiosInstance.ts';

export type ShelterImageCategory =
  | 'EXTERIOR'
  | 'INTERIOR'
  | 'ENTRANCE'
  | 'RAMP'
  | 'ELEVATOR'
  | 'TOILET'
  | 'BRAILLE'
  | 'SIGNAGE'
  | 'ETC';

export interface ShelterReportImageItem {
  fileId: number;
  category?: ShelterImageCategory;
  description?: string;
}

export interface ShelterReportCreateRequest {
  shelterId: number;
  signageLanguage?: string;
  accessibleToilet?: boolean;
  ramp?: boolean;
  elevator?: boolean;
  brailleBlock?: boolean;
  etcFacilities?: string;
  images?: ShelterReportImageItem[];
}

export async function createShelterReport(
  body: ShelterReportCreateRequest,
): Promise<number> {
  const { data } = await api.post('/api/app/shelter-reports', body);
  return data.data;
}

export interface LocalShelterReportImage {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  category: ShelterImageCategory;
  description?: string;
}

interface PresignedUrlResponse {
  url: string;
  objectKey: string;
  bucketName: string;
  contentType: string;
  fileName: string;
}

interface FileUploadResponse {
  fileId: number;
}

export async function uploadShelterReportImages(
  images: LocalShelterReportImage[],
): Promise<ShelterReportImageItem[]> {
  if (!images.length) return [];

  const presignedUrls = await getShelterImagePresignedUrls(images);

  await Promise.all(
    images.map((image, index) => uploadToS3(image, presignedUrls[index])),
  );

  const uploadedFiles = await registerShelterImageFiles(images, presignedUrls);

  return uploadedFiles.map((file, index) => ({
    fileId: file.fileId,
    category: images[index].category,
    description: images[index].description?.trim() || undefined,
  }));
}

async function getShelterImagePresignedUrls(
  images: LocalShelterReportImage[],
): Promise<PresignedUrlResponse[]> {
  const { data } = await api.post<PresignedUrlResponse[]>('/api/presigned-url', {
    fileType: 'APP_SHELTER_IMAGE',
    files: images.map(image => ({
      fileName: image.fileName,
      contentType: image.contentType,
    })),
  });

  return data;
}

async function uploadToS3(
  image: LocalShelterReportImage,
  presignedUrl: PresignedUrlResponse,
): Promise<void> {
  const file = await fetch(image.uri);
  const blob = await file.blob();
  const response = await fetch(presignedUrl.url, {
    method: 'PUT',
    headers: {
      'Content-Type': presignedUrl.contentType || image.contentType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

async function registerShelterImageFiles(
  images: LocalShelterReportImage[],
  presignedUrls: PresignedUrlResponse[],
): Promise<FileUploadResponse[]> {
  const { data } = await api.post<{ data: FileUploadResponse[] }>(
    '/api/upload-file',
    {
      fileType: 'APP_SHELTER_IMAGE',
      files: images.map((image, index) => ({
        fileName: presignedUrls[index].fileName || image.fileName,
        objectKey: presignedUrls[index].objectKey,
        contentType: presignedUrls[index].contentType || image.contentType,
        bucketName: presignedUrls[index].bucketName,
        fileSize: image.fileSize,
      })),
    },
  );

  return data.data;
}
