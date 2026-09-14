"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Code2,
  Columns3,
  Eraser,
  FileUp,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  Undo2,
  Unlink2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { looksLikeMarkdown, markdownToHtml, normalizeEditorLink } from "@/lib/editor/markdownToHtml";
import styles from "./RichTextEditor.module.css";

type RichTextEditorProps = {
  value: string;
  onChange: (content: string) => void;
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [newTab, setNewTab] = useState(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Placeholder.configure({
        placeholder: "Write your field note here — or paste Markdown and watch it format itself…",
      }),
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({
        table: {
          resizable: true,
          renderWrapper: true,
          HTMLAttributes: { class: "editor-table" },
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: styles.content,
        spellcheck: "true",
        "aria-label": "Article content editor",
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (!looksLikeMarkdown(text)) return false;
        event.preventDefault();
        view.pasteHTML(markdownToHtml(text));
        toast.success("Markdown pasted and formatted.");
        return true;
      },
      handleKeyDown(view, event) {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return false;
        event.preventDefault();
        const { from, to, $from } = view.state.selection;
        const linkMark = (view.state.storedMarks ?? $from.marks()).find((mark) => mark.type.name === "link");
        setLinkUrl(typeof linkMark?.attrs.href === "string" ? linkMark.attrs.href : "");
        setLinkText(from === to ? "" : view.state.doc.textBetween(from, to, " "));
        setNewTab(linkMark?.attrs.target === "_blank" || !linkMark);
        setLinkOpen(true);
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return <div className={styles.loading}>Preparing the writing studio…</div>;
  }

  const text = editor.getText();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const blockLabel = getBlockLabel(editor);
  const inTable = editor.isActive("table");

  const openLinkEditor = () => {
    const attributes = editor.getAttributes("link") as { href?: string; target?: string };
    const { from, to } = editor.state.selection;
    setLinkUrl(attributes.href ?? "");
    setLinkText(from === to ? "" : editor.state.doc.textBetween(from, to, " "));
    setNewTab(attributes.target === "_blank" || !attributes.href);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = normalizeEditorLink(linkUrl);
    if (!href) {
      toast.error("Enter a valid website, email, phone, anchor, or internal /path.");
      return;
    }

    const attributes = {
      href,
      target: newTab && /^https?:\/\//i.test(href) ? "_blank" : null,
      rel: newTab && /^https?:\/\//i.test(href) ? "noopener noreferrer" : null,
    };
    const { empty } = editor.state.selection;

    if (empty) {
      editor.chain().focus().insertContent({
        type: "text",
        text: linkText.trim() || href.replace(/^mailto:/, ""),
        marks: [{ type: "link", attrs: attributes }],
      }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attributes).run();
    }
    setLinkOpen(false);
  };

  const importMarkdown = async (file: File) => {
    if (!/\.(md|markdown|mdown|txt)$/i.test(file.name)) {
      toast.error("Choose a Markdown (.md) or text file.");
      return;
    }
    const markdown = await file.text();
    const html = markdownToHtml(markdown);
    if (editor.isEmpty) editor.commands.setContent(html);
    else editor.chain().focus().insertContent(html).run();
    toast.success(`${file.name} imported and formatted.`);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void importMarkdown(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const file = Array.from(event.dataTransfer.files).find((item) => /\.(md|markdown|mdown|txt)$/i.test(item.name));
    if (!file) return;
    event.preventDefault();
    void importMarkdown(file);
  };

  return (
    <TooltipProvider delayDuration={350}>
      <div className={styles.shell} onDrop={handleDrop}>
        <div className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Writing studio</p>
            <p className={styles.hint}>Paste Markdown, drop a .md file, or format as you write.</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".md,.markdown,.mdown,.txt,text/markdown,text/plain" className="sr-only" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FileUp /> Import Markdown
          </Button>
        </div>

        <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
          <div className={styles.group}>
            <ToolButton label="Undo" shortcut="Ctrl Z" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 /></ToolButton>
            <ToolButton label="Redo" shortcut="Ctrl Shift Z" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 /></ToolButton>
          </div>

          <div className={styles.group}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={styles.blockMenu} aria-label="Choose text style">
                  {blockLabel} <ChevronDown />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                <DropdownMenuLabel>Text style</DropdownMenuLabel>
                <BlockItem active={editor.isActive("paragraph")} onSelect={() => editor.chain().focus().setParagraph().run()} icon={<Pilcrow />} label="Paragraph" />
                <BlockItem active={editor.isActive("heading", { level: 2 })} onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 />} label="Section heading" />
                <BlockItem active={editor.isActive("heading", { level: 3 })} onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 />} label="Subheading" />
                <BlockItem active={editor.isActive("heading", { level: 4 })} onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} icon={<Heading4 />} label="Small heading" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className={styles.group}>
            <ToolButton label="Bold" shortcut="Ctrl B" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolButton>
            <ToolButton label="Italic" shortcut="Ctrl I" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolButton>
            <ToolButton label="Underline" shortcut="Ctrl U" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></ToolButton>
            <ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></ToolButton>
            <ToolButton label="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter /></ToolButton>
            <ToolButton label="Inline code" shortcut="Ctrl E" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 /></ToolButton>
          </div>

          <div className={styles.group}>
            <ToolButton label="Add or edit link" shortcut="Ctrl K" active={editor.isActive("link")} onClick={openLinkEditor}><Link2 /></ToolButton>
            <ToolButton label="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink2 /></ToolButton>
          </div>

          <div className={styles.group}>
            <ToolButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolButton>
            <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolButton>
            <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolButton>
            <ToolButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 /></ToolButton>
            <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></ToolButton>
          </div>

          <div className={styles.group}>
            <ToolButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft /></ToolButton>
            <ToolButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter /></ToolButton>
            <ToolButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight /></ToolButton>
            <ToolButton label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify /></ToolButton>
          </div>

          <div className={styles.group}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={cn(styles.iconButton, inTable && styles.active)} aria-label="Table options"><Table2 /><ChevronDown className={styles.chevron} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-52">
                <DropdownMenuLabel>Table</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 /> Insert 3 × 3 table</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().addRowAfter().run()}><Rows3 /> Add row below</DropdownMenuItem>
                <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().addColumnAfter().run()}><Columns3 /> Add column right</DropdownMenuItem>
                <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().toggleHeaderRow().run()}><Heading3 /> Toggle header row</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={!inTable} onSelect={() => editor.chain().focus().deleteTable().run()}><Trash2 /> Delete table</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser /></ToolButton>
          </div>
        </div>

        <EditorContent editor={editor} />

        <div className={styles.statusbar}>
          <span><span className={styles.statusDot} /> {blockLabel}</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>{text.length.toLocaleString()} characters</span>
          <span className={styles.shortcut}>Tip: <kbd>Ctrl</kbd> + <kbd>K</kbd> adds a link</span>
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editor.isActive("link") ? "Edit link" : "Add a link"}</DialogTitle>
            <DialogDescription>Use a full website URL, an email address, an anchor, or an internal path such as /catalog.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {editor.state.selection.empty && (
              <div className="space-y-2"><Label htmlFor="link-label">Text to display</Label><Input id="link-label" value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Read the complete guide" /></div>
            )}
            <div className="space-y-2"><Label htmlFor="link-url">Link destination</Label><Input id="link-url" autoFocus value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } }} placeholder="https://example.com or /catalog" /></div>
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)} className="size-4 accent-current" />
              Open external links in a new tab
            </label>
          </div>
          <DialogFooter>
            {editor.isActive("link") && <Button type="button" variant="outline" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }}>Remove link</Button>}
            <Button type="button" onClick={applyLink}>Apply link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function ToolButton({ label, shortcut, active, disabled, onClick, children }: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={cn(styles.iconButton, active && styles.active)} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</button>
      </TooltipTrigger>
      <TooltipContent side="bottom"><span>{label}</span>{shortcut && <span className="ml-2 opacity-60">{shortcut}</span>}</TooltipContent>
    </Tooltip>
  );
}

function BlockItem({ active, onSelect, icon, label }: { active: boolean; onSelect: () => void; icon: ReactNode; label: string }) {
  return <DropdownMenuItem onSelect={onSelect}>{icon}<span className="flex-1">{label}</span>{active && <Check />}</DropdownMenuItem>;
}

function getBlockLabel(editor: Editor) {
  if (editor.isActive("heading", { level: 2 })) return "Section heading";
  if (editor.isActive("heading", { level: 3 })) return "Subheading";
  if (editor.isActive("heading", { level: 4 })) return "Small heading";
  if (editor.isActive("codeBlock")) return "Code block";
  if (editor.isActive("blockquote")) return "Quote";
  return "Paragraph";
}
