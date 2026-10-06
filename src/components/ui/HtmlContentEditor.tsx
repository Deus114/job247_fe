import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

type HtmlContentEditorProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  hint?: string;
  placeholder?: string;
  compact?: boolean;
};

const btnBase =
  "w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  icon,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${btnBase} ${
        active
          ? "border-primary-300 bg-primary-50 text-primary-700"
          : "border-background-200/70 text-foreground-600 hover:bg-background-100"
      }`}
    >
      <i className={`${icon} text-sm`}></i>
    </button>
  );
}

function ToolbarDivider() {
  return <span className="w-px h-6 bg-background-200/80 mx-0.5 self-center" />;
}

function normalizeHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") {
    return "";
  }
  return html;
}

/** Shared TipTap HTML editor — used across admin config and employer job forms. */
export default function HtmlContentEditor({
  label,
  value,
  onChange,
  hint,
  placeholder,
  compact = false,
}: HtmlContentEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary-600 underline" },
      }),
      Placeholder.configure({
        placeholder: placeholder || t("editor.placeholder"),
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg" },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "border-collapse w-full my-2" },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-background-200 bg-background-100 px-2 py-1",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-background-200 px-2 py-1",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: [
          "tiptap outline-none prose prose-sm max-w-none px-4 py-3 text-sm text-foreground-800",
          "[&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold",
          "[&_a]:text-primary-600 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
          "[&_table]:text-sm",
          compact
            ? "min-h-[120px] max-h-[280px] overflow-y-auto"
            : "min-h-[200px] max-h-[480px] overflow-y-auto",
        ].join(" "),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(normalizeHtml(current.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || "";
    const current = normalizeHtml(editor.getHTML());
    if (current !== normalizeHtml(next)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground-700 mb-1.5">
          {label}
        </label>
        {hint && <p className="text-[11px] text-foreground-400 mb-2">{hint}</p>}
        <div
          className={`border border-background-200/70 rounded-xl bg-background-50 ${
            compact ? "min-h-[160px]" : "min-h-[240px]"
          } flex items-center justify-center text-sm text-foreground-400`}
        >
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("editor.linkPrompt"), previous || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  };

  const setImage = () => {
    const url = window.prompt(t("editor.imagePrompt"), "https://");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground-700 mb-1.5">
        {label}
      </label>
      {hint && <p className="text-[11px] text-foreground-400 mb-2">{hint}</p>}
      <div className="border border-background-200/70 rounded-xl overflow-hidden bg-background-50">
        <div className="flex flex-wrap gap-1 p-2 border-b border-background-200/70 bg-background-100/60">
          <ToolbarButton
            title={t("editor.undo")}
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
            icon="ri-arrow-go-back-line"
          />
          <ToolbarButton
            title={t("editor.redo")}
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
            icon="ri-arrow-go-forward-line"
          />
          <ToolbarDivider />
          <ToolbarButton
            title={t("editor.bold")}
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon="ri-bold"
          />
          <ToolbarButton
            title={t("editor.italic")}
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon="ri-italic"
          />
          <ToolbarButton
            title={t("editor.underline")}
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            icon="ri-underline"
          />
          <ToolbarButton
            title={t("editor.strike")}
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon="ri-strikethrough"
          />
          <ToolbarDivider />
          <ToolbarButton
            title={t("editor.heading2")}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            icon="ri-h-2"
          />
          <ToolbarButton
            title={t("editor.heading3")}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            icon="ri-h-3"
          />
          <ToolbarDivider />
          <ToolbarButton
            title={t("editor.bulletList")}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon="ri-list-unordered"
          />
          <ToolbarButton
            title={t("editor.orderedList")}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon="ri-list-ordered"
          />
          <ToolbarButton
            title={t("editor.blockquote")}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon="ri-double-quotes-l"
          />
          <ToolbarButton
            title={t("editor.horizontalRule")}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            icon="ri-separator"
          />
          <ToolbarDivider />
          <ToolbarButton
            title={t("editor.alignLeft")}
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            icon="ri-align-left"
          />
          <ToolbarButton
            title={t("editor.alignCenter")}
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            icon="ri-align-center"
          />
          <ToolbarButton
            title={t("editor.alignRight")}
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            icon="ri-align-right"
          />
          <ToolbarDivider />
          <ToolbarButton
            title={t("editor.link")}
            active={editor.isActive("link")}
            onClick={setLink}
            icon="ri-link"
          />
          <ToolbarButton
            title={t("editor.image")}
            onClick={setImage}
            icon="ri-image-line"
          />
          <ToolbarButton
            title={t("editor.table")}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            icon="ri-table-line"
          />
          <ToolbarButton
            title={t("editor.clearFormat")}
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            icon="ri-format-clear"
          />
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
