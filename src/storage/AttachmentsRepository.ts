import { db } from './db';
import type { AttachmentsRepository } from '../domain/attachments/AttachmentsRepository';
import type { Attachment } from '../domain/attachments/types';

export class DexieAttachmentsRepository implements AttachmentsRepository {
  async add(attachment: Attachment): Promise<void> {
    await db.attachments.add(attachment);
  }

  async get(id: string): Promise<Attachment | undefined> {
    return db.attachments.get(id);
  }

  async listByNote(noteId: string): Promise<Attachment[]> {
    return db.attachments.where('noteId').equals(noteId).reverse().sortBy('createdAt');
  }

  async update(id: string, patch: Partial<Pick<Attachment, 'filename'>>): Promise<void> {
    await db.attachments.update(id, patch);
  }

  async delete(id: string): Promise<void> {
    await db.attachments.delete(id);
  }
}
