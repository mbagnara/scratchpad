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
}
