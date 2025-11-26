'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Strikethrough, Link as LinkIcon } from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden bg-white", className)}>
      {editable && (
        <div className="bg-gray-50 border-b p-2 flex items-center gap-1 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button
            onClick={setLink}
            className={cn(
              "p-1.5 rounded hover:bg-gray-200 transition-colors",
              editor.isActive('link') ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            )}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

