import { Platform } from 'react-native';
import Config from 'react-native-config';
import ReactNativeBlobUtil from 'react-native-blob-util';
import api from '../lib/axiosInstance.ts';

export type AppFeedbackCategory =
  | 'BUG'
  | 'IMPROVEMENT'
  | 'SHELTER_DATA'
  | 'CONTENT'
  | 'ETC';

export interface AppFeedbackCreateRequest {
  category?: AppFeedbackCategory;
  content: string;
  contact?: string;
  appVersion: string;
  platform: string;
  osVersion: string;
  deviceModel: string;
  screen?: string;
  imageFileIds?: number[];
}

export interface LocalFeedbackImage {
  id: string;
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
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

export function getFeedbackDeviceInfo() {
  const constants = Platform.constants as Record<string, unknown>;
  const model =
    typeof constants.Model === 'string'
      ? constants.Model
      : typeof constants.model === 'string'
      ? constants.model
      : Platform.OS;

  return {
    appVersion: Config.APP_VERSION || '0.0.1',
    platform: Platform.OS.toUpperCase(),
    osVersion: String(Platform.Version),
    deviceModel: model,
  };
}

export async function createAppFeedback(
  body: AppFeedbackCreateRequest,
): Promise<number> {
  const { data } = await api.post('/api/app/feedbacks', body);
  return data.data;
}

export async function uploadFeedbackImages(
  images: LocalFeedbackImage[],
): Promise<number[]> {
  if (!images.length) return [];

  const presignedUrls = await getFeedbackImagePresignedUrls(images);
  await Promise.all(
    images.map((image, index) => uploadToS3(image, presignedUrls[index])),
  );

  const uploadedFiles = await registerFeedbackImageFiles(
    images,
    presignedUrls,
  );
  return uploadedFiles.map(file => file.fileId);
}

async function getFeedbackImagePresignedUrls(
  images: LocalFeedbackImage[],
): Promise<PresignedUrlResponse[]> {
  const { data } = await api.post<PresignedUrlResponse[]>('/api/presigned-url', {
    fileType: 'FEEDBACK_IMAGE',
    files: images.map(image => ({
      fileName: image.fileName,
      contentType: image.contentType,
    })),
  });

  return data;
}

async function uploadToS3(
  image: LocalFeedbackImage,
  presignedUrl: PresignedUrlResponse,
): Promise<void> {
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
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

function toBlobUtilPath(uri: string) {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

async function registerFeedbackImageFiles(
  images: LocalFeedbackImage[],
  presignedUrls: PresignedUrlResponse[],
): Promise<FileUploadResponse[]> {
  const { data } = await api.post<{ data: FileUploadResponse[] }>(
    '/api/upload-file',
    {
      fileType: 'FEEDBACK_IMAGE',
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
