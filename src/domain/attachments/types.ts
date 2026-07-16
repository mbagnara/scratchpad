export type AttachmentPlacement = 'inline' | 'note';

export interface Attachment {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: number;
  /** Missing on legacy records, which are treated as inline attachments. */
  placement?: AttachmentPlacement;
}
