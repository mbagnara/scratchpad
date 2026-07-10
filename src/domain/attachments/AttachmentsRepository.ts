import type { Attachment } from './types';

export interface AttachmentsRepository {
  add(attachment: Attachment): Promise<void>;
  get(id: string): Promise<Attachment | undefined>;
}
