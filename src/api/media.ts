import { Platform } from "react-native";
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

    const fileUri = typeof file === "string" ? file : file.uri;
    const fileName = typeof file === "object" && file.name ? file.name : "profile.jpg";
    const fileType = typeof file === "object" && file.type ? file.type : "image/jpeg";

    formData.append("file", {
      uri: Platform.OS === "android" ? fileUri : fileUri.replace("file://", ""),
      name: fileName,
      type: fileType,
    } as any);
    formData.append("type", type);

    return apiClient.post<MediaResponse>("/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
