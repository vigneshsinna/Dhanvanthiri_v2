import { useCallback, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const TOOLBAR_BUTTONS = [
  { cmd: 'bold', icon: 'B', title: 'Bold', style: 'font-bold' },
  { cmd: 'italic', icon: 'I', title: 'Italic', style: 'italic' },
  { cmd: 'underline', icon: 'U', title: 'Underline', style: 'underline' },
  { cmd: 'strikeThrough', icon: 'S', title: 'Strikethrough', style: 'line-through' },
  { divider: true },
  { cmd: 'formatBlock:H2', icon: 'H2', title: 'Heading 2' },
  { cmd: 'formatBlock:H3', icon: 'H3', title: 'Heading 3' },
  { cmd: 'formatBlock:P', icon: 'P', title: 'Paragraph' },
  { divider: true },
  { cmd: 'insertUnorderedList', icon: 'Bullet List', title: 'Bullet List' },
  { cmd: 'insertOrderedList', icon: '1. List', title: 'Numbered List' },
  { divider: true },
  { cmd: 'justifyLeft', icon: 'Left', title: 'Align Left' },
  { cmd: 'justifyCenter', icon: 'Center', title: 'Align Center' },
  { divider: true },
  { cmd: 'createLink', icon: 'Link', title: 'Insert Link' },
  { cmd: 'insertImage', icon: 'Image', title: 'Insert Image' },
  { cmd: 'removeFormat', icon: 'Clear', title: 'Clear Formatting' },
] as const;

function isSafeImageSrc(value: string): boolean {
  const src = value.trim();
  return src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function RichTextEditor({ value, onChange, placeholder = 'Start typing...', minHeight = '200px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const syncEditor = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleCommand = useCallback((cmd: string) => {
    if (cmd.startsWith('formatBlock:')) {
      const tag = cmd.split(':')[1];
      document.execCommand('formatBlock', false, tag);
    } else if (cmd === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'insertImage') {
      const url = prompt('Enter image URL or uploaded file path:');
      if (!url || !isSafeImageSrc(url)) return;
      const alt = prompt('Enter image alt text:') || '';
      document.execCommand('insertHTML', false, `<img src="${escapeAttribute(url.trim())}" alt="${escapeAttribute(alt.trim())}" />`);
    } else {
      document.execCommand(cmd, false);
    }
    syncEditor();
  }, [syncEditor]);

  const handleInput = useCallback(() => {
    syncEditor();
  }, [syncEditor]);

  const lastSetValue = useRef(value);
  if (editorRef.current && value !== lastSetValue.current && !isInternalChange.current) {
    editorRef.current.innerHTML = value;
    lastSetValue.current = value;
  }
  isInternalChange.current = false;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLBAR_BUTTONS.map((btn, i) => {
          if ('divider' in btn) {
            return <div key={i} className="mx-1 h-5 w-px bg-slate-300" />;
          }
          return (
            <button
              key={btn.cmd}
              type="button"
              title={btn.title}
              onMouseDown={(e) => { e.preventDefault(); handleCommand(btn.cmd); }}
              className={`rounded px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-200 ${('style' in btn && btn.style) ? btn.style : ''}`}
            >
              {btn.icon}
            </button>
          );
        })}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className="prose prose-sm max-w-none px-3 py-2 focus:outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
