import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Move, X, RotateCw } from 'lucide-react';

// Simple Image Component with resize functionality
const SimpleImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // const [aspectRatio, setAspectRatio] = useState<number | null>(null); // For future aspect ratio locking
  const imageRef = useRef<HTMLImageElement>(null);

  const { src, alt, width, height, rotation = 0 } = node.attrs;

  // Calculate aspect ratio when image loads
  useEffect(() => {
    if (src) {
      const img = new Image();
      img.onload = () => {
        // const ratio = img.width / img.height;
        // setAspectRatio(ratio);
      };
      img.src = src;
    }
  }, [src]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = (_e: any, _direction: any, ref: HTMLElement, _delta: any, _position: any) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;
    
    // Ensure minimum size and maintain aspect ratio if needed
    const finalWidth = Math.max(newWidth, 30);
    const finalHeight = Math.max(newHeight, 30);
    
    updateAttributes({
      width: finalWidth,
      height: finalHeight,
    });
    
    setIsResizing(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (_e: any, _data: any) => {
    setIsDragging(false);
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
      as="div"
      className="simple-image-wrapper"
    >
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Rnd
          size={{ width: width || 300, height: height || 200 }}
          position={{ x: 0, y: 0 }}
          onResizeStart={handleResizeStart}
          onResizeStop={handleResizeStop}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          lockAspectRatio={false}
          minWidth={50}
          minHeight={50}
          maxWidth={800}
          maxHeight={600}
          bounds="parent"
          className={`simple-image ${isHovered ? 'ring-2 ring-blue-500' : ''} ${isResizing ? 'ring-blue-400' : ''} ${isDragging ? 'ring-green-400' : ''}`}
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          }}
          dragHandleClassName="drag-handle"
          resizeHandleStyles={{
            top: {
              cursor: 'ns-resize',
              width: '100%',
              height: '8px',
              top: '-4px',
              left: '0',
              background: 'rgba(59, 130, 246, 0.3)',
              opacity: isHovered ? 1 : 0.5,
            },
            right: {
              cursor: 'ew-resize',
              width: '8px',
              height: '100%',
              top: '0',
              right: '-4px',
              background: 'rgba(59, 130, 246, 0.3)',
              opacity: isHovered ? 1 : 0.5,
            },
            bottom: {
              cursor: 'ns-resize',
              width: '100%',
              height: '8px',
              bottom: '-4px',
              left: '0',
              background: 'rgba(59, 130, 246, 0.3)',
              opacity: isHovered ? 1 : 0.5,
            },
            left: {
              cursor: 'ew-resize',
              width: '8px',
              height: '100%',
              top: '0',
              left: '-4px',
              background: 'rgba(59, 130, 246, 0.3)',
              opacity: isHovered ? 1 : 0.5,
            },
            topRight: {
              cursor: 'nesw-resize',
              width: '12px',
              height: '12px',
              top: '-6px',
              right: '-6px',
              background: 'linear-gradient(45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
              borderRadius: '50%',
              opacity: isHovered ? 1 : 0.7,
            },
            bottomRight: {
              cursor: 'nwse-resize',
              width: '12px',
              height: '12px',
              bottom: '-6px',
              right: '-6px',
              background: 'linear-gradient(45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
              borderRadius: '50%',
              opacity: isHovered ? 1 : 0.7,
            },
            bottomLeft: {
              cursor: 'nesw-resize',
              width: '12px',
              height: '12px',
              bottom: '-6px',
              left: '-6px',
              background: 'linear-gradient(45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
              borderRadius: '50%',
              opacity: isHovered ? 1 : 0.7,
            },
            topLeft: {
              cursor: 'nwse-resize',
              width: '12px',
              height: '12px',
              top: '-6px',
              left: '-6px',
              background: 'linear-gradient(45deg, transparent 30%, #3b82f6 30%, #3b82f6 70%, transparent 70%)',
              borderRadius: '50%',
              opacity: isHovered ? 1 : 0.7,
            }
          }}
        >
          <div className="relative w-full h-full group">
            {/* Image */}
            <img
              ref={imageRef}
              src={src}
              alt={alt || 'Image'}
              className="w-full h-full object-contain select-none"
              draggable={false}
              style={{
                pointerEvents: 'none',
                transform: `rotate(${rotation}deg)`,
                transition: isResizing || isDragging ? 'none' : 'transform 0.2s ease',
              }}
            />
            
            {/* Control Overlay */}
            {isHovered && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Drag Handle */}
                <div className="drag-handle absolute top-2 left-2 pointer-events-auto">
                  <Move className="w-4 h-4" />
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                  <button
                    onClick={handleRotate}
                    className="apple-button apple-button-secondary"
                    title="Rotate Image"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={handleRemove}
                    className="apple-button apple-button-destructive"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Size Info */}
                <div className="size-info absolute bottom-2 left-2 pointer-events-none">
                  {Math.round(width || 300)} × {Math.round(height || 200)}
                  {rotation !== 0 && ` (${rotation}°)`}
                </div>
                
                {/* Resize Handle Visual Indicator */}
                <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-t-transparent border-r-[20px] border-r-blue-500 opacity-50 pointer-events-none" />
              </div>
            )}
          </div>
        </Rnd>
      </div>
    </NodeViewWrapper>
  );
};

// Simple Image Extension
export const SimpleImageExtension = Node.create({
  name: 'simpleImage',
  
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

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
      rotation: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom: any) => ({
          src: dom.getAttribute('src'),
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          width: dom.getAttribute('width') ? parseInt(dom.getAttribute('width')) : 300,
          height: dom.getAttribute('height') ? parseInt(dom.getAttribute('height')) : 200,
          rotation: 0,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SimpleImageComponent);
  },

  addCommands() {
    return {
      setSimpleImage: (options: { 
        src: string; 
        alt?: string; 
        title?: string; 
        width?: number; 
        height?: number; 
        rotation?: number;
      }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            ...options,
            width: options.width || 300,
            height: options.height || 200,
            rotation: options.rotation || 0,
          },
        });
      },
    } as any;
  },
});
