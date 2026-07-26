import apiClient from "./client";

export interface MediaResponse {
  id: string;
  url: string;
  type: string;
}

export const mediaApi = {
  /**
   * Upload media file (like profile picture).
   */
  upload: (file: any, type: "profile_picture") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    return apiClient.post<MediaResponse>("/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
