'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { SimpleImageExtension } from '@/lib/tiptap/simple-image-extension';
import { FloatingImageExtension } from '@/lib/tiptap/floating-image-extension';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import PopupModal, { usePopup } from '@/components/ui/PopupModal';
import '@/styles/advanced-image.css';
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
  const [showListDropdown, setShowListDropdown] = useState(false);
  const listDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { popupState, showPopup, closePopup, showError, showWarning } = usePopup();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showListDropdown) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target as Node)) {
        setShowListDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListDropdown]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // Direct image upload handler
  const handleDirectImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      showError('File Too Large', `File size must be less than 5MB. Your file is ${fileSizeMB.toFixed(2)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Get image dimensions
        const img = new Image();
        img.onload = async () => {
          // Calculate appropriate size (max 800px width)
          let width = img.width;
          let height = img.height;
          
          if (width > 800) {
            const aspectRatio = width / height;
            width = 800;
            height = Math.round(800 / aspectRatio);
          }

          try {
            // Upload to server
            const response = await fetch('/api/upload/image', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: base64,
                type: 'content',
              }),
            });

            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();

            // Insert image directly at cursor position with default settings
            editor.chain().focus().setFloatingImage({
              src: data.url,
              alt: file.name,
              width: width,
              height: height,
              wrapMode: 'inline', // Default to inline
              margin: 10, // Default margin
            }).run();

            // Image successfully inserted - no need for a popup notification
          } catch (error) {
            showError('Upload Failed', 'Failed to upload image. Please try again.');
          } finally {
            setIsUploading(false);
          }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showError('Upload Failed', 'Failed to process image. Please try again.');
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  // Font size options from 8 to 16
  const fontSizes = [8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Apple-style font options
  const fontFamilies = [
    { value: 'inherit', label: 'Default' },
    { value: '-apple-system, BlinkMacSystemFont, sans-serif', label: 'SF Pro Text' },
    { value: 'ui-serif, Georgia, serif', label: 'Georgia' },
    { value: 'ui-monospace, Menlo, Monaco, monospace', label: 'SF Mono' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  ];

  const getCurrentFontSize = () => {
    const marks = editor.state.selection.$from.marks();
    const textStyleMark = marks.find((mark: any) => mark.type.name === 'textStyle');
    if (textStyleMark?.attrs?.fontSize) {
      return parseInt(textStyleMark.attrs.fontSize);
    }
    return 12; // default
  };

  return (
    <>
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

      {/* Font Size Selector */}
      <select
        onChange={(e) => {
          const size = e.target.value;
          editor.chain().focus().setFontSize(`${size}pt`).run();
        }}
        value={getCurrentFontSize()}
        className="px-3 py-1.5 text-sm rounded-md border border-color-border bg-color-bg text-color-text hover:bg-color-surface focus:outline-none focus:ring-2 focus:ring-color-primary/20"
        title="Font Size"
      >
        {fontSizes.map(size => (
          <option key={size} value={size}>
            {size}pt
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

      {/* List Dropdown */}
      <div className="relative" ref={listDropdownRef}>
        <button
          onClick={() => setShowListDropdown(!showListDropdown)}
          className={`p-2 rounded-md transition-colors ${
            (editor.isActive('bulletList') || editor.isActive('orderedList'))
              ? 'bg-color-primary text-white' 
              : 'hover:bg-color-fill text-color-text'
          }`}
          title="List Options"
        >
          {editor.isActive('orderedList') ? (
            <ListOrdered className="w-4 h-4" />
          ) : (
            <List className="w-4 h-4" />
          )}
        </button>
        
        {/* List Dropdown Menu */}
        {showListDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[180px]">
            <button
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                setShowListDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <List className="w-4 h-4" />
              <span>Bullet List</span>
              <span className="text-xs text-gray-500 ml-auto">• • •</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                setShowListDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Numbered List</span>
              <span className="text-xs text-gray-500 ml-auto">1. 2. 3.</span>
            </button>
            <button
              onClick={() => {
                // Apply CSS class for alphabetic list
                editor.chain().focus().toggleOrderedList().run();
                // Add list-style-type: lower-alpha to the list
                if (editor.isActive('orderedList')) {
                  editor.chain().focus().updateAttributes('orderedList', { 
                    HTMLAttributes: { style: 'list-style-type: lower-alpha;' } 
                  }).run();
                }
                setShowListDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <ListOrdered className="w-4 h-4" />
              <span>Letter List</span>
              <span className="text-xs text-gray-500 ml-auto">a. b. c.</span>
            </button>
          </div>
        )}
      </div>

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

      {/* Link */}
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
      
      {/* Direct Image Upload - No Modal */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDirectImageUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`p-2 rounded-md hover:bg-color-fill text-color-text transition-colors ${
          isUploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={isUploading ? 'Uploading...' : 'Insert Image (Direct)'}
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

    
    {/* Removed: Advanced Image Upload Modal - Now using direct insertion */}

    {/* Popup Modal */}
    <PopupModal
      isOpen={popupState.isOpen}
      onClose={closePopup}
      type={popupState.type}
      title={popupState.title}
      message={popupState.message}
      onConfirm={popupState.onConfirm}
      onCancel={popupState.onCancel}
    />
    </>
  );
};

// Custom FontSize extension
const CustomFontSize = FontSize.extend({
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
});

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
        paragraph: {
          HTMLAttributes: {
            class: 'text-color-text',
          },
        },
        link: false, // Disable the default Link extension to avoid duplicates
      }),
      Color,
      TextStyle,
      CustomFontSize,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      ...(allowLinks ? [Link.configure({
        openOnClick: false,
        validate: (href) => /^https?:\/\//.test(href),
        HTMLAttributes: {
          class: 'text-color-primary hover:underline',
        },
      })] : []),
      SimpleImageExtension,
      FloatingImageExtension,
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
      handlePaste: (view, event) => {
        // Allow default paste behavior
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
            padding-bottom: ${(maxLength || minLength) ? '3.5rem' : '1rem'};
            min-height: 150px;
            outline: none;
            color: var(--color-text);
          }
          
          .rich-text-content .ProseMirror p {
            margin: 0.5rem 0;
            line-height: 1.6;
          }
          
          .rich-text-content .ProseMirror ul,
          .rich-text-content .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          
          .rich-text-content .ProseMirror li {
            margin: 0.25rem 0;
          }
          
          .rich-text-content .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          /* Floating image styles */
          .rich-text-content .ProseMirror .floating-image-wrapper {
            transition: all 0.2s ease;
          }
          
          .rich-text-content .ProseMirror .floating-image-wrapper[style*="float: left"] {
            clear: left;
          }
          
          .rich-text-content .ProseMirror .floating-image-wrapper[style*="float: right"] {
            clear: right;
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