import { v4 as uuid } from 'uuid';
import type { AttachmentsRepository } from './AttachmentsRepository';

export const ATTACHMENT_SCHEME = 'notebook-attachment:';

export class AttachmentsService {
  private objectUrlCache = new Map<string, string>();

  constructor(private repo: AttachmentsRepository) {}

  async save(file: File, noteId: string): Promise<string> {
    const id = uuid();
    await this.repo.add({
      id,
      noteId,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      blob: file,
      createdAt: Date.now(),
    });
    return `${ATTACHMENT_SCHEME}${id}`;
  }

  async resolveUrl(storedUrl: string): Promise<string> {
    if (!storedUrl.startsWith(ATTACHMENT_SCHEME)) return storedUrl;
    const id = storedUrl.slice(ATTACHMENT_SCHEME.length);

    const cached = this.objectUrlCache.get(id);
    if (cached) return cached;

    const attachment = await this.repo.get(id);
    if (!attachment) throw new Error(`Attachment ${id} not found`);

    const objectUrl = URL.createObjectURL(attachment.blob);
    this.objectUrlCache.set(id, objectUrl);
    return objectUrl;
  }
}
