import { create } from 'zustand';
import {
  createShelterReport,
  uploadShelterReportImages,
  type LocalShelterReportImage,
  type ShelterReportCreateRequest,
} from '../services/report.service.ts';

type SubmitShelterReportRequest = ShelterReportCreateRequest & {
  localImages?: LocalShelterReportImage[];
};

interface ShelterReportStore {
  isSubmitting: boolean;
  submitReport: (body: SubmitShelterReportRequest) => Promise<number>;
}

export const useShelterReportStore = create<ShelterReportStore>(set => ({
  isSubmitting: false,
  submitReport: async body => {
    set({ isSubmitting: true });
    try {
      const images = await uploadShelterReportImages(body.localImages ?? []);
      const reportBody = { ...body };
      delete reportBody.localImages;
      return await createShelterReport({
        ...reportBody,
        images,
      });
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
