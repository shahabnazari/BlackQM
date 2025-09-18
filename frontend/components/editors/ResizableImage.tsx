'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Maximize2, Minimize2, Move, X } from 'lucide-react';

interface ResizableImageProps {
  src: string;
  alt?: string;
  initialSize?: { width: number; height: number };
  onResize?: (size: { width: number; height: number }) => void;
  onRemove?: () => void;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  editable?: boolean;
}

export const ResizableImage: React.FC<ResizableImageProps> = ({
  src,
  alt = '',
  initialSize = { width: 300, height: 200 },
  onResize,
  onRemove,
  maxWidth = '100%',
  maxHeight = '100%',
  minWidth = 100,
  minHeight = 100,
  className = '',
  editable = true
}) => {
  const [size, setSize] = useState(initialSize);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate aspect ratio when image loads
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      setAspectRatio(ratio);
      
      // Adjust initial size to maintain aspect ratio
      if (initialSize.width && initialSize.height) {
        const adjustedHeight = initialSize.width / ratio;
        setSize({ width: initialSize.width, height: adjustedHeight });
      }
    };
    img.src = src;
  }, [src, initialSize]);

  const handleResizeStop = (_e: any, _direction: any, ref: HTMLElement, _delta: any, position: any) => {
    const newSize = {
      width: ref.offsetWidth,
      height: ref.offsetHeight
    };
    setSize(newSize);
    setPosition(position);
    
    if (onResize) {
      onResize(newSize);
    }
  };

  const handleDragStop = (_e: any, data: any) => {
    setPosition({ x: data.x, y: data.y });
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      // Restore previous size
      setSize(initialSize);
      setPosition({ x: 0, y: 0 });
    } else {
      // Get parent container dimensions
      const parent = containerRef.current?.parentElement;
      if (parent) {
        const parentWidth = parent.offsetWidth;
        const parentHeight = parent.offsetHeight;
        
        // Calculate size maintaining aspect ratio
        if (aspectRatio) {
          const scaledWidth = Math.min(parentWidth * 0.9, parentHeight * 0.9 * aspectRatio);
          const scaledHeight = scaledWidth / aspectRatio;
          
          setSize({ width: scaledWidth, height: scaledHeight });
          setPosition({ 
            x: (parentWidth - scaledWidth) / 2, 
            y: (parentHeight - scaledHeight) / 2 
          });
        }
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!editable) {
    return (
      <div className={`resizable-image-static ${className}`}>
        <img 
          src={src} 
          alt={alt}
          style={{ 
            width: size.width,
            height: size.height,
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="resizable-image-container relative inline-block">
      <Rnd
        size={size}
        position={position}
        onResizeStop={handleResizeStop}
        onDragStop={handleDragStop}
        lockAspectRatio={aspectRatio !== null}
        minWidth={minWidth}
        minHeight={minHeight}
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        bounds="parent"
        className={`resizable-image ${className} ${isHovered ? 'ring-2 ring-blue-500' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        enableResizing={{
          top: false,
          right: true,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: true,
          bottomLeft: false,
          topLeft: false
        }}
        dragHandleClassName="drag-handle"
        resizeHandleStyles={{
          bottomRight: {
            cursor: 'nwse-resize',
            width: '20px',
            height: '20px',
            right: '0',
            bottom: '0'
          }
        }}
      >
        <div className="relative w-full h-full group">
          {/* Image */}
          <img 
            ref={imageRef}
            src={src} 
            alt={alt}
            className="w-full h-full object-contain select-none"
            draggable={false}
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Control Overlay */}
          {isHovered && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Drag Handle */}
              <div className="drag-handle absolute top-2 left-2 p-2 bg-white bg-opacity-90 rounded-lg shadow-md pointer-events-auto cursor-move">
                <Move className="w-4 h-4 text-gray-600" />
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white bg-opacity-90 rounded-lg shadow-md hover:bg-opacity-100 transition-all"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="p-2 bg-white bg-opacity-90 rounded-lg shadow-md hover:bg-red-50 hover:bg-opacity-100 transition-all"
                    title="Remove image"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
              
              {/* Resize Handle Visual */}
              <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-t-transparent border-r-[20px] border-r-blue-500 opacity-50 pointer-events-none" />
              
              {/* Size Info */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded pointer-events-none">
                {Math.round(size.width)} × {Math.round(size.height)}
              </div>
            </div>
          )}
        </div>
      </Rnd>
      
      {/* Fullscreen Backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleFullscreen}
          style={{ pointerEvents: isFullscreen ? 'auto' : 'none' }}
        />
      )}
    </div>
  );
};

// Export a simpler version for use in rich text editors
export const InlineResizableImage: React.FC<{
  src: string;
  alt?: string;
  onResize?: (width: number, height: number) => void;
  initialWidth?: number;
  initialHeight?: number;
}> = ({ src, alt = '', onResize, initialWidth = 400, initialHeight = 300 }) => {
  const [dimensions, setDimensions] = useState({ 
    width: initialWidth, 
    height: initialHeight 
  });

  const handleResize = (size: { width: number; height: number }) => {
    setDimensions(size);
    if (onResize) {
      onResize(size.width, size.height);
    }
  };

  return (
    <div className="inline-resizable-image-wrapper inline-block my-2">
      <ResizableImage
        src={src}
        alt={alt}
        initialSize={dimensions}
        onResize={handleResize}
        maxWidth="100%"
        className="inline-block"
      />
    </div>
  );
};