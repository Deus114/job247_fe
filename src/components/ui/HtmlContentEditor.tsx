import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type HtmlContentEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  hint?: string;
};

const btnClass =
  'w-8 h-8 flex items-center justify-center rounded-lg border border-background-200/70 text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer';

/** Lightweight HTML editor (contentEditable) — content saved as HTML for backend. */
export default function HtmlContentEditor({ label, value, onChange, hint }: HtmlContentEditorProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground-700 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-foreground-400 mb-2">{hint}</p>}
      <div className="border border-background-200/70 rounded-xl overflow-hidden bg-background-50">
        <div className="flex flex-wrap gap-1 p-2 border-b border-background-200/70 bg-background-100/60">
          <button type="button" className={btnClass} title="Bold" onClick={() => exec('bold')}>
            <i className="ri-bold text-sm"></i>
          </button>
          <button type="button" className={btnClass} title="Italic" onClick={() => exec('italic')}>
            <i className="ri-italic text-sm"></i>
          </button>
          <button type="button" className={btnClass} title="Underline" onClick={() => exec('underline')}>
            <i className="ri-underline text-sm"></i>
          </button>
          <button type="button" className={btnClass} title="H2" onClick={() => exec('formatBlock', 'h2')}>
            <i className="ri-heading text-sm"></i>
          </button>
          <button type="button" className={btnClass} title="List" onClick={() => exec('insertUnorderedList')}>
            <i className="ri-list-unordered text-sm"></i>
          </button>
          <button type="button" className={btnClass} title="Ordered list" onClick={() => exec('insertOrderedList')}>
            <i className="ri-list-ordered text-sm"></i>
          </button>
          <button
            type="button"
            className={btnClass}
            title="Link"
            onClick={() => {
              const url = window.prompt(t('adminUi.businessConfig.editorLinkPrompt'));
              if (url) exec('createLink', url);
            }}
          >
            <i className="ri-link text-sm"></i>
          </button>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[200px] max-h-[420px] overflow-y-auto px-4 py-3 text-sm text-foreground-800 focus:outline-none prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-semibold [&_a]:text-primary-600"
          onInput={() => {
            if (ref.current) onChange(ref.current.innerHTML);
          }}
        />
      </div>
    </div>
  );
}
