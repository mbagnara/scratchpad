import type { Attachment } from './types';

export interface AttachmentsRepository {
  add(attachment: Attachment): Promise<void>;
  get(id: string): Promise<Attachment | undefined>;
  listByNote(noteId: string): Promise<Attachment[]>;
  update(id: string, patch: Partial<Pick<Attachment, 'filename'>>): Promise<void>;
  delete(id: string): Promise<void>;
}
