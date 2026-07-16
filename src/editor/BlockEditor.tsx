import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Block } from '@blocknote/core';
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { BlockNoteView } from '@blocknote/mantine';
import { SuggestionMenuController, useCreateBlockNote } from '@blocknote/react';
import { AttachmentUploadError, attachmentsService } from '../domain/attachments';
import { useUIStore } from '../state/uiStore';
import { editorSchema } from './schema';
import { getSlashMenuItems } from './slash-menu/getSlashMenuItems';
import './BlockEditor.css';

interface Props {
  noteId: string;
  initialContent: Block[];
  onChange: (blocks: Block[]) => void;
}

export interface BlockEditorHandle {
  openFilePicker: () => void;
}

type AttachmentStatus =
  | { type: 'idle' }
  | { type: 'uploading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

const CODE_BLOCK_SELECTOR = '.bn-block-content[data-content-type="codeBlock"]';

export const BlockEditor = forwardRef<BlockEditorHandle, Props>(function BlockEditor(
  { noteId, initialContent, onChange },
  ref,
) {
  const theme = useUIStore((s) => s.theme);
  const editor = useCreateBlockNote({
    schema: editorSchema,
    initialContent: initialContent.length > 0 ? initialContent : undefined,
    uploadFile: async (file) => attachmentsService.save(file, noteId),
    resolveFileUrl: async (url) => attachmentsService.resolveUrl(url),
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<number | undefined>(undefined);
  const [attachmentStatus, setAttachmentStatus] = useState<AttachmentStatus>({ type: 'idle' });

  useImperativeHandle(ref, () => ({
    openFilePicker: () => fileInputRef.current?.click(),
  }), []);

  const showTemporaryStatus = (status: AttachmentStatus) => {
    window.clearTimeout(statusTimerRef.current);
    setAttachmentStatus(status);
    if (status.type !== 'uploading') {
      statusTimerRef.current = window.setTimeout(
        () => setAttachmentStatus({ type: 'idle' }),
        status.type === 'error' ? 5000 : 2600,
      );
    }
  };

  const getBlockType = (file: File) => {
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const insertAttachment = async (file: File) => {
    showTemporaryStatus({ type: 'uploading', message: `Attaching ${file.name}…` });
    try {
      const result = await editor.uploadFile?.(file);
      if (!result) throw new Error('File uploads are unavailable.');

      const props = typeof result === 'string'
        ? { url: result, name: file.name }
        : { ...((result as { props?: Record<string, unknown> }).props ?? result), name: file.name };
      insertOrUpdateBlockForSlashMenu(editor, {
        type: getBlockType(file),
        props,
      } as never);
      showTemporaryStatus({ type: 'success', message: `${file.name} attached` });
    } catch (error) {
      const message = error instanceof AttachmentUploadError
        ? error.message
        : `Couldn't attach ${file.name}.`;
      showTemporaryStatus({ type: 'error', message });
    }
  };

  const handleSelectedFiles = async (files: File[]) => {
    for (const file of files) await insertAttachment(file);
    editor.focus();
  };

  useEffect(() => () => {
    window.clearTimeout(statusTimerRef.current);
    attachmentsService.releaseObjectUrls();
  }, []);

  // BlockNote's code block has no built-in copy button. ProseMirror owns the
  // editor's DOM subtree (and replaces individual block nodes on updates like
  // a language change), so copy buttons live in a separate overlay layer and
  // hover is tracked via delegation on the stable wrapper rather than
  // listeners glued to a specific, possibly short-lived, block node.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const overlay = overlayRef.current;
    if (!wrapper || !overlay) return;

    const buttonsByBlock = new Map<Element, HTMLButtonElement>();

    const getOrCreateButton = (block: Element) => {
      const existing = buttonsByBlock.get(block);
      if (existing) return existing;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = 'Copy';
      button.addEventListener('click', () => {
        const code = block.querySelector('code')?.textContent ?? '';
        navigator.clipboard.writeText(code);
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 1500);
      });
      overlay.appendChild(button);
      buttonsByBlock.set(block, button);
      return button;
    };

    const positionButtons = () => {
      const codeBlocks = wrapper.querySelectorAll(CODE_BLOCK_SELECTOR);
      const seen = new Set<Element>();
      const wrapperRect = wrapper.getBoundingClientRect();

      codeBlocks.forEach((block) => {
        seen.add(block);
        const button = getOrCreateButton(block);
        const blockRect = block.getBoundingClientRect();
        button.style.top = `${blockRect.top - wrapperRect.top + 6}px`;
        button.style.left = `${blockRect.right - wrapperRect.left - button.offsetWidth - 6}px`;
      });

      buttonsByBlock.forEach((button, block) => {
        if (!seen.has(block)) {
          button.remove();
          buttonsByBlock.delete(block);
        }
      });
    };

    const findBlock = (target: EventTarget | null) =>
      target instanceof Element ? target.closest(CODE_BLOCK_SELECTOR) : null;

    const handlePointerOver = (e: PointerEvent) => {
      const block = findBlock(e.target);
      if (!block) return;
      getOrCreateButton(block).classList.add('code-copy-button--visible');
    };

    const handlePointerOut = (e: PointerEvent) => {
      const block = findBlock(e.target);
      if (!block) return;
      const related = e.relatedTarget;
      if (related instanceof Node && (block.contains(related) || overlay.contains(related))) return;
      buttonsByBlock.get(block)?.classList.remove('code-copy-button--visible');
    };

    positionButtons();
    const observer = new MutationObserver(positionButtons);
    observer.observe(wrapper, { childList: true, subtree: true, characterData: true, attributes: true });
    window.addEventListener('resize', positionButtons);
    wrapper.addEventListener('pointerover', handlePointerOver);
    wrapper.addEventListener('pointerout', handlePointerOut);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', positionButtons);
      wrapper.removeEventListener('pointerover', handlePointerOver);
      wrapper.removeEventListener('pointerout', handlePointerOut);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;

    if (e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      const { block } = editor.getTextCursorPosition();
      editor.updateBlock(block, { type: 'codeBlock' } as never);
    } else if (e.key === '/') {
      e.preventDefault();
      const suggestionMenu = editor.extensions.get('suggestionMenu') as
        | { openSuggestionMenu: (triggerCharacter: string) => void }
        | undefined;
      suggestionMenu?.openSuggestionMenu('/');
    }
  };

  return (
    <div className="block-editor" ref={wrapperRef} onKeyDown={handleKeyDown}>
      <input
        ref={fileInputRef}
        className="block-editor__file-input"
        type="file"
        multiple
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (files.length > 0) void handleSelectedFiles(files);
        }}
      />
      {attachmentStatus.type !== 'idle' && (
        <div
          className={`attachment-status attachment-status--${attachmentStatus.type}`}
          role={attachmentStatus.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {attachmentStatus.type === 'uploading' && <span className="attachment-status__spinner" />}
          <span>{attachmentStatus.message}</span>
        </div>
      )}
      <BlockNoteView
        editor={editor}
        slashMenu={false}
        theme={theme}
        onChange={() => onChange(editor.document as unknown as Block[])}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(getSlashMenuItems(editor), query)}
        />
      </BlockNoteView>
      <div className="block-editor__overlay" ref={overlayRef} />
    </div>
  );
});
