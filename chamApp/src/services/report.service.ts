import api from '../lib/axiosInstance.ts';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
  console.log('[report-submit] create report request', body);
  const { data } = await api.post('/api/app/shelter-reports', body);
  console.log('[report-submit] create report response', data);
  return data.data;
}

export interface LocalShelterReportImage {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  category: ShelterImageCategory;
  description?: string;
  base64?: string;
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

  console.log('[report-submit] upload images start', images);
  const presignedUrls = await getShelterImagePresignedUrls(images);
  console.log('[report-submit] presigned urls', presignedUrls);

  await Promise.all(
    images.map((image, index) => uploadToS3(image, presignedUrls[index])),
  );
  console.log('[report-submit] s3 upload complete');

  const uploadedFiles = await registerShelterImageFiles(images, presignedUrls);
  console.log('[report-submit] upload-file response', uploadedFiles);

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
  console.log('[report-submit] local image read start', {
    uri: image.uri,
    fileName: image.fileName,
    contentType: image.contentType,
  });
  console.log('[report-submit] s3 put start', {
    url: presignedUrl.url,
    fileName: image.fileName,
    uri: image.uri,
  });
  const response = await ReactNativeBlobUtil.fetch(
    'PUT',
    presignedUrl.url,
    {
      'Content-Type': presignedUrl.contentType || image.contentType,
    },
    ReactNativeBlobUtil.wrap(toBlobUtilPath(image.uri)),
  );
  const status = response.info().status;

  if (status < 200 || status >= 300) {
    console.log('[report-submit] s3 upload failed', {
      status,
      fileName: image.fileName,
    });
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

function toBlobUtilPath(uri: string) {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
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
