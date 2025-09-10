import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Move, 
  X, 
  RotateCw, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize2,
  Square,
  Image as ImageIcon
} from 'lucide-react';

// Floating Image Component with text wrapping and drag-and-drop
const FloatingImageComponent = ({ node, updateAttributes, deleteNode, selected }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const { 
    src, 
    alt, 
    width = 300, 
    height = 200, 
    wrapMode = 'inline',
    margin = 10,
    rotation = 0,
    alignment = 'left',
    hasBorder = false
  } = node.attrs;
  
  const [showBorder, setShowBorder] = useState(hasBorder);

  // Handle resize with mouse
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Calculate new dimensions maintaining aspect ratio
      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;
      
      // Maintain aspect ratio
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
      
      // Apply minimum constraints
      newWidth = Math.max(50, Math.min(800, newWidth));
      newHeight = Math.max(50, Math.min(600, newHeight));
      
      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, height, updateAttributes]);

  // Calculate wrapper styles based on wrap mode
  const getWrapperStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'relative',
      display: wrapMode === 'inline' ? 'inline-block' : 'block',
      marginTop: margin,
      marginBottom: margin,
      marginLeft: margin,
      marginRight: margin,
      maxWidth: '100%',
    };

    switch (wrapMode) {
      case 'left':
        return {
          ...baseStyles,
          float: 'left',
          marginRight: margin * 2,
        };
      case 'right':
        return {
          ...baseStyles,
          float: 'right',
          marginLeft: margin * 2,
        };
      case 'center':
        return {
          ...baseStyles,
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'block',
          clear: 'both',
        };
      case 'break-text':
        return {
          ...baseStyles,
          float: alignment === 'left' ? 'left' : 'right',
          shapeOutside: 'margin-box',
          marginLeft: alignment === 'right' ? margin * 2 : margin,
          marginRight: alignment === 'left' ? margin * 2 : margin,
        };
      default:
        return baseStyles;
    }
  };

  const handleWrapModeChange = (mode: string) => {
    updateAttributes({ wrapMode: mode });
  };

  const handleAlignmentChange = (align: string) => {
    updateAttributes({ alignment: align });
  };

  const handleMarginChange = (newMargin: number) => {
    updateAttributes({ margin: newMargin });
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    updateAttributes({ rotation: newRotation });
  };

  const handleRemove = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper 
      className="floating-image-wrapper"
      style={getWrapperStyles()}
      contentEditable={false}
      draggable={true}
      data-drag-handle
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div
        ref={containerRef}
        className={`relative inline-block group ${selected ? 'ring-2 ring-blue-500' : ''} ${isDragging ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: width,
          height: height,
          transition: isResizing ? 'none' : 'all 0.2s ease',
          cursor: 'move',
        }}
      >
        {/* Main Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || 'Image'}
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isResizing ? 'none' : 'transform 0.2s ease',
            borderRadius: '8px',
            border: showBorder ? '2px solid rgba(0, 0, 0, 0.15)' : 'none',
            boxShadow: showBorder ? '0 2px 12px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        />

        {/* Control Overlay */}
        {(isHovered || selected) && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Controls */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between pointer-events-auto">
              <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
                {/* Drag Indicator */}
                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded cursor-move" title="Drag to reposition">
                  <Move className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                {/* Wrap Mode Controls */}
                <button
                  onClick={() => handleWrapModeChange('inline')}
                  className={`p-1.5 rounded transition-colors ${
                    wrapMode === 'inline' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Inline with text"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWrapModeChange('left')}
                  className={`p-1.5 rounded transition-colors ${
                    wrapMode === 'left' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Float left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWrapModeChange('center')}
                  className={`p-1.5 rounded transition-colors ${
                    wrapMode === 'center' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWrapModeChange('right')}
                  className={`p-1.5 rounded transition-colors ${
                    wrapMode === 'right' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Float right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
                <button
                  onClick={handleRotate}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const newBorder = !showBorder;
                    setShowBorder(newBorder);
                    updateAttributes({ hasBorder: newBorder });
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    showBorder 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="Toggle border"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Resize Handles at exact corners */}
            <div
              ref={resizeHandleRef}
              onMouseDown={handleResizeStart}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize pointer-events-auto hover:bg-blue-600 transition-colors border-2 border-white"
              style={{
                bottom: '0',
                right: '0',
                transform: 'translate(50%, 50%)',
              }}
            />
            <div
              onMouseDown={handleResizeStart}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-nesw-resize pointer-events-auto hover:bg-blue-600 transition-colors border-2 border-white"
              style={{
                bottom: '0',
                left: '0',
                transform: 'translate(-50%, 50%)',
              }}
            />
            <div
              onMouseDown={handleResizeStart}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-nesw-resize pointer-events-auto hover:bg-blue-600 transition-colors border-2 border-white"
              style={{
                top: '-8px',
                right: '-8px',
              }}
            />
            <div
              onMouseDown={handleResizeStart}
              className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize pointer-events-auto hover:bg-blue-600 transition-colors border-2 border-white"
              style={{
                top: '-8px',
                left: '-8px',
              }}
            />

            {/* Size Info */}
            {isResizing && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded pointer-events-none whitespace-nowrap">
                {Math.round(width)} × {Math.round(height)}px
              </div>
            )}
          </div>
        )}

      </div>
    </NodeViewWrapper>
  );
};

// Floating Image Extension
export const FloatingImageExtension = Node.create({
  name: 'floatingImage',
  
  group: 'block',
  inline: false,
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: 300,
      },
      height: {
        default: 200,
      },
      wrapMode: {
        default: 'inline', // inline, left, right, center, break-text
      },
      alignment: {
        default: 'left', // left, center, right
      },
      margin: {
        default: 10,
      },
      rotation: {
        default: 0,
      },
      hasBorder: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-floating-image]',
        getAttrs: (dom: any) => ({
          src: dom.querySelector('img')?.getAttribute('src'),
          alt: dom.querySelector('img')?.getAttribute('alt'),
          title: dom.querySelector('img')?.getAttribute('title'),
          width: parseInt(dom.dataset.width || '300'),
          height: parseInt(dom.dataset.height || '200'),
          wrapMode: dom.dataset.wrapMode || 'inline',
          alignment: dom.dataset.alignment || 'left',
          margin: parseInt(dom.dataset.margin || '10'),
          rotation: parseInt(dom.dataset.rotation || '0'),
          hasBorder: dom.dataset.hasBorder === 'true',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, width, height, wrapMode, alignment, margin, rotation, hasBorder } = HTMLAttributes;
    
    return [
      'figure',
      {
        'data-floating-image': '',
        'data-width': width,
        'data-height': height,
        'data-wrap-mode': wrapMode,
        'data-alignment': alignment,
        'data-margin': margin,
        'data-rotation': rotation,
        'data-has-border': hasBorder,
        style: `
          display: ${wrapMode === 'inline' ? 'inline-block' : 'block'};
          float: ${wrapMode === 'left' ? 'left' : wrapMode === 'right' ? 'right' : 'none'};
          margin: ${margin}px;
          ${wrapMode === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}
        `,
      },
      [
        'img',
        {
          src,
          alt,
          title,
          width,
          height,
          style: `transform: rotate(${rotation}deg);`,
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageComponent);
  },

  addCommands() {
    return {
      setFloatingImage: (options: { 
        src: string; 
        alt?: string; 
        title?: string; 
        width?: number; 
        height?: number;
        wrapMode?: string;
        alignment?: string;
        margin?: number;
        rotation?: number;
        hasBorder?: boolean;
      }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            ...options,
            width: options.width || 300,
            height: options.height || 200,
            wrapMode: options.wrapMode || 'inline',
            alignment: options.alignment || 'left',
            margin: options.margin || 10,
            rotation: options.rotation || 0,
            hasBorder: options.hasBorder || false,
          },
        });
      },
    } as any;
  },
});