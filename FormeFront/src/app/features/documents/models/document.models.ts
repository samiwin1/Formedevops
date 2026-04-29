export type DocumentOwnerType = "USER" | "ADMIN";

export interface AdminDocument {
  id?: number;
  title?: string;
  fileName?: string;
  fileType?: string;
  filePath?: string;
  ownerId?: number;
  ownerType?: DocumentOwnerType | string;
  formationId?: number;
  uploadedAt?: string;
  previewText?: string;
}
