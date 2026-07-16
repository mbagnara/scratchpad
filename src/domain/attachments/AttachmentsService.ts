import { v4 as uuid } from 'uuid';
import type { AttachmentsRepository } from './AttachmentsRepository';

export const ATTACHMENT_SCHEME = 'notebook-attachment:';
export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export class AttachmentUploadError extends Error {
  readonly code: 'empty' | 'too-large' | 'quota' | 'storage';

  constructor(
    message: string,
    code: 'empty' | 'too-large' | 'quota' | 'storage',
  ) {
    super(message);
    this.name = 'AttachmentUploadError';
    this.code = code;
  }
}

export class AttachmentsService {
  private objectUrlCache = new Map<string, string>();
  private repo: AttachmentsRepository;

  constructor(repo: AttachmentsRepository) {
    this.repo = repo;
  }

  async save(file: File, noteId: string): Promise<string> {
    await this.validate(file);
    const id = uuid();
    try {
      await this.repo.add({
        id,
        noteId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        blob: file,
        createdAt: Date.now(),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new AttachmentUploadError('There is not enough local storage for this file.', 'quota');
      }
      throw new AttachmentUploadError('The file could not be saved locally.', 'storage');
    }
    return `${ATTACHMENT_SCHEME}${id}`;
  }

  private async validate(file: File): Promise<void> {
    if (file.size === 0) {
      throw new AttachmentUploadError('Empty files cannot be attached.', 'empty');
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new AttachmentUploadError('Files must be smaller than 25 MB.', 'too-large');
    }

    const storage = navigator.storage;
    if (!storage?.estimate) return;

    try {
      void storage.persist?.().catch(() => false);
      const { quota, usage = 0 } = await storage.estimate();
      if (quota !== undefined && usage + file.size > quota) {
        throw new AttachmentUploadError('There is not enough local storage for this file.', 'quota');
      }
    } catch (error) {
      if (error instanceof AttachmentUploadError) throw error;
      // Browsers may deny storage estimates. The IndexedDB write remains the
      // source of truth and maps quota errors above.
    }
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

  releaseObjectUrls(): void {
    this.objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrlCache.clear();
  }
}
