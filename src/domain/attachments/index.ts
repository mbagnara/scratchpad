import { DexieAttachmentsRepository } from '../../storage/AttachmentsRepository';
import { AttachmentsService } from './AttachmentsService';

export const attachmentsService = new AttachmentsService(new DexieAttachmentsRepository());

export * from './types';
export * from './AttachmentsService';
