export interface Attachment {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
}
