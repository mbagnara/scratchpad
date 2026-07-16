import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ATTACHMENT_SCHEME,
  AttachmentUploadError,
  attachmentsService,
  type Attachment,
} from '../../domain/attachments';
import './NoteAttachments.css';

interface Props {
  noteId: string;
}

export interface NoteAttachmentsHandle {
  openFilePicker: () => void;
}

type Status = { type: 'idle' | 'uploading' | 'success' | 'error'; message?: string };

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getBadge = (attachment: Attachment) => {
  if (attachment.mimeType.startsWith('image/')) return 'IMG';
  if (attachment.mimeType === 'application/pdf') return 'PDF';
  if (attachment.mimeType.startsWith('audio/')) return 'AUD';
  if (attachment.mimeType.startsWith('video/')) return 'VID';
  const extension = attachment.filename.split('.').pop();
  return extension && extension !== attachment.filename ? extension.slice(0, 4).toUpperCase() : 'FILE';
};

export const NoteAttachments = forwardRef<NoteAttachmentsHandle, Props>(function NoteAttachments(
  { noteId },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<number | undefined>(undefined);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  useImperativeHandle(ref, () => ({
    openFilePicker: () => fileInputRef.current?.click(),
  }), []);

  useEffect(() => {
    let cancelled = false;
    attachmentsService.listNoteAttachments(noteId).then((items) => {
      if (!cancelled) setAttachments(items);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(statusTimerRef.current);
    };
  }, [noteId]);

  const showStatus = (next: Status) => {
    window.clearTimeout(statusTimerRef.current);
    setStatus(next);
    if (next.type !== 'uploading') {
      statusTimerRef.current = window.setTimeout(
        () => setStatus({ type: 'idle' }),
        next.type === 'error' ? 5000 : 2400,
      );
    }
  };

  const uploadFiles = async (files: File[]) => {
    setExpanded(true);
    for (const file of files) {
      showStatus({ type: 'uploading', message: `Attaching ${file.name}…` });
      try {
        await attachmentsService.save(file, noteId, 'note');
        setAttachments(await attachmentsService.listNoteAttachments(noteId));
        showStatus({ type: 'success', message: `${file.name} attached` });
      } catch (error) {
        showStatus({
          type: 'error',
          message: error instanceof AttachmentUploadError
            ? error.message
            : `Couldn't attach ${file.name}.`,
        });
      }
    }
  };

  const download = async (attachment: Attachment) => {
    const url = await attachmentsService.resolveUrl(`${ATTACHMENT_SCHEME}${attachment.id}`);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const remove = async (attachment: Attachment) => {
    if (!window.confirm(`Remove ${attachment.filename} from this note?`)) return;
    await attachmentsService.delete(attachment.id);
    setAttachments((items) => items.filter((item) => item.id !== attachment.id));
    showStatus({ type: 'success', message: `${attachment.filename} removed` });
  };

  const startRename = (attachment: Attachment) => {
    setRenamingId(attachment.id);
    setRenameDraft(attachment.filename);
  };

  const commitRename = async (attachment: Attachment) => {
    try {
      await attachmentsService.rename(attachment.id, renameDraft);
      setAttachments((items) => items.map((item) => (
        item.id === attachment.id ? { ...item, filename: renameDraft.trim().slice(0, 255) } : item
      )));
      setRenamingId(null);
    } catch (error) {
      showStatus({ type: 'error', message: error instanceof Error ? error.message : 'Rename failed.' });
    }
  };

  return (
    <>
      <div className={`note-attachments ${expanded ? 'note-attachments--expanded' : ''}`}>
      <input
        ref={fileInputRef}
        className="note-attachments__file-input"
        type="file"
        multiple
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) void uploadFiles(files);
        }}
      />

      {(attachments.length > 0 || status.type !== 'idle') && (
        <section className="note-attachments__panel" aria-label="Note attachments">
          <button
            className="note-attachments__header"
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <span className="note-attachments__header-icon" aria-hidden="true">⌕</span>
            <span>Attachments</span>
            <span className="note-attachments__count">{attachments.length}</span>
            <span className="note-attachments__chevron" aria-hidden="true">›</span>
          </button>

          {expanded && (
            <div className="note-attachments__content">
              {status.type !== 'idle' && (
                <div className={`note-attachments__status note-attachments__status--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
                  {status.type === 'uploading' && <span className="note-attachments__spinner" />}
                  {status.message}
                </div>
              )}

              {attachments.map((attachment) => (
                <div className="note-attachment" key={attachment.id}>
                  <span className="note-attachment__type">{getBadge(attachment)}</span>
                  <div className="note-attachment__details">
                    {renamingId === attachment.id ? (
                      <input
                        className="note-attachment__rename"
                        value={renameDraft}
                        autoFocus
                        aria-label="Attachment filename"
                        onChange={(event) => setRenameDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            void commitRename(attachment);
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            setRenamingId(null);
                          }
                        }}
                        onBlur={() => setRenamingId(null)}
                      />
                    ) : (
                      <strong title={attachment.filename}>{attachment.filename}</strong>
                    )}
                    <span>{attachment.mimeType || 'File'} · {formatSize(attachment.size)}</span>
                  </div>
                  <div className="note-attachment__actions">
                    <button type="button" aria-label={`Download ${attachment.filename}`} onClick={() => void download(attachment)}>Download</button>
                    <button type="button" aria-label={`Rename ${attachment.filename}`} onClick={() => startRename(attachment)}>Rename</button>
                    <button className="note-attachment__remove" type="button" aria-label={`Remove ${attachment.filename}`} onClick={() => void remove(attachment)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      </div>

    </>
  );
});
