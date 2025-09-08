'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  showToolbar?: boolean;
  allowImages?: boolean;
  allowLinks?: boolean;
  className?: string;
}

const EditorToolbar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  // Apple-style font options
  const fontFamilies = [
    { value: 'inherit', label: 'Default' },
    { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: 'SF Pro Text' },
    { value: 'ui-serif, Georgia, serif', label: 'Georgia' },
    { value: 'ui-monospace, Menlo, Monaco, monospace', label: 'SF Mono' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: '"Comic Sans MS", cursive', label: 'Comic Sans' },
    { value: '"Brush Script MT", cursive', label: 'Brush Script' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-3 border-b border-color-border bg-color-surface rounded-t-lg">
      {/* Font Family Selector */}
      <select
        onChange={(e) => {
          editor.chain().focus().setFontFamily(e.target.value).run();
        }}
        value={editor.getAttributes('textStyle').fontFamily || 'inherit'}
        className="px-3 py-1.5 text-sm rounded-md border border-color-border bg-color-bg text-color-text hover:bg-color-surface focus:outline-none focus:ring-2 focus:ring-color-primary/20"
        title="Font Family"
      >
        {fontFamilies.map(font => (
          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
            {font.label}
          </option>
        ))}
      </select>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* Text Style Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive('bold') 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Bold (⌘B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive('italic') 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Italic (⌘I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* List Buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive('bulletList') 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive('orderedList') 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* Alignment Buttons */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'left' }) 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'center' }) 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive({ textAlign: 'right' }) 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* Heading Selector */}
      <select
        onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? 1 :
          editor.isActive('heading', { level: 2 }) ? 2 :
          editor.isActive('heading', { level: 3 }) ? 3 : 0
        }
        className="px-3 py-1.5 text-sm rounded-md border border-color-border bg-color-bg text-color-text hover:bg-color-surface focus:outline-none focus:ring-2 focus:ring-color-primary/20"
      >
        <option value={0}>Normal</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* Link and Image */}
      <button
        onClick={addLink}
        className={`p-2 rounded-md transition-colors ${
          editor.isActive('link') 
            ? 'bg-color-primary text-white' 
            : 'hover:bg-color-fill text-color-text'
        }`}
        title="Add Link (⌘K)"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      <button
        onClick={addImage}
        className="p-2 rounded-md hover:bg-color-fill text-color-text transition-colors"
        title="Add Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-color-border mx-1" />

      {/* Color Picker */}
      <div className="relative">
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-8 h-8 rounded-md cursor-pointer border border-color-border"
          title="Text Color"
        />
      </div>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  minLength,
  showToolbar = true,
  allowImages = true,
  allowLinks = true,
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Better paste handling
        paragraph: {
          HTMLAttributes: {
            class: 'text-color-text',
          },
        },
      }),
      Color,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
        HTMLAttributes: {
          class: 'text-color-primary hover:underline',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rich-text-image max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none text-color-text',
      },
      // Allow default paste behavior for rich text and plain text
      handlePaste: (view, event) => {
        // Don't prevent default paste behavior - let TipTap handle it
        // This allows both rich text and plain text paste to work
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when prop changes (for template switching)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const characterCount = editor?.storage.characterCount?.characters() || 0;
  const wordCount = editor?.storage.characterCount?.words() || 0;

  return (
    <div className={`rich-text-editor border border-color-border rounded-lg overflow-hidden shadow-sm ${className}`}>
      {showToolbar && <EditorToolbar editor={editor} />}
      
      <div className="relative bg-color-bg">
        <EditorContent 
          editor={editor} 
          className="rich-text-content min-h-[150px]"
        />
        
        <style jsx global>{`
          .rich-text-content .ProseMirror {
            padding: 1rem;
            min-height: 150px;
            outline: none;
            color: var(--color-text);
          }
          
          .rich-text-content .ProseMirror p {
            margin: 0.5rem 0;
          }
          
          .rich-text-content .ProseMirror h1 {
            font-size: 1.875rem;
            font-weight: 700;
            margin: 1rem 0;
          }
          
          .rich-text-content .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0.875rem 0;
          }
          
          .rich-text-content .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0.75rem 0;
          }
          
          .rich-text-content .ProseMirror ul,
          .rich-text-content .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          
          .rich-text-content .ProseMirror li {
            margin: 0.25rem 0;
          }
          
          .rich-text-content .ProseMirror .is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: var(--color-text-tertiary);
            pointer-events: none;
            float: left;
            height: 0;
          }
          
          .rich-text-content .ProseMirror:focus {
            outline: none;
          }
        `}</style>
        
        {(maxLength || minLength) && (
          <div className="absolute bottom-2 right-2 text-xs bg-color-bg/95 backdrop-blur-sm px-3 py-1.5 rounded-md border border-color-border shadow-sm">
            {maxLength && (
              <span className={`font-medium ${
                characterCount > maxLength * 0.95 ? 'text-color-danger' :
                characterCount > maxLength * 0.8 ? 'text-color-warning' :
                'text-color-success'
              }`}>
                {Math.max(0, maxLength - characterCount)} characters remaining
              </span>
            )}
            {!maxLength && (
              <span className="font-medium text-color-text-secondary">
                {characterCount} characters
              </span>
            )}
            <span className="text-color-text-tertiary mx-2">•</span>
            <span className="font-medium text-color-text-secondary">{wordCount} words</span>
            {minLength && characterCount < minLength && (
              <>
                <span className="text-color-text-tertiary mx-2">•</span>
                <span className="text-color-danger">
                  Need {minLength - characterCount} more
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;