'use client';

import { Button } from '@/components/apple-ui/Button';
import { Check, Pen, RotateCcw, Type, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface ResearcherSignatureProps {
  onSignatureComplete: (signatureUrl: string) => void;
  currentSignatureUrl?: string;
  onRemove?: () => void;
}

type SignatureMethod = 'draw' | 'upload' | 'type';

export const ResearcherSignature: React.FC<ResearcherSignatureProps> = ({
  onSignatureComplete,
  currentSignatureUrl,
  onRemove,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureMethod, setSignatureMethod] =
    useState<SignatureMethod>('draw');
  const [typedName, setTypedName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentSignatureUrl || null
  );

  useEffect(() => {
    setPreviewUrl(currentSignatureUrl || null);
  }, [currentSignatureUrl]);

  const handleDrawnSignature = async () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsSaving(true);
      try {
        const dataUrl = sigCanvas.current.toDataURL();

        // Upload to server
        const formData = new FormData();
        formData.append('base64', dataUrl);

        const response = await fetch('/api/upload/signature', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { url } = await response.json();
          setPreviewUrl(url);
          onSignatureComplete(url);
        } else {
          const error = await response.json();
          alert(`Failed to save signature: ${error.error}`);
        }
      } catch (error: any) {
        console.error('Error saving drawn signature:', error);
        alert('Failed to save signature. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTypedSignature = async () => {
    if (!typedName.trim()) return;

    setIsSaving(true);
    try {
      // Create canvas with typed signature
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 500;
      canvas.height = 150;

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw typed name as signature - LARGER font size
      ctx.fillStyle = '#000033';
      ctx.font =
        'italic 48px "Brush Script MT", "Lucida Handwriting", "Segoe Script", cursive';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 40, 75);

      const dataUrl = canvas.toDataURL('image/png');

      // Upload to server
      const formData = new FormData();
      formData.append('base64', dataUrl);

      const response = await fetch('/api/upload/signature', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setPreviewUrl(url);
        onSignatureComplete(url);
      } else {
        const error = await response.json();
        alert(`Failed to save signature: ${error.error}`);
      }
    } catch (error: any) {
      console.error('Error saving typed signature:', error);
      alert('Failed to save signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('signature', file);

      const response = await fetch('/api/upload/signature', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setPreviewUrl(url);
        onSignatureComplete(url);
      } else {
        const error = await response.json();
        alert(`Failed to upload signature: ${error.error}`);
      }
    } catch (error: any) {
      console.error('Error uploading signature:', error);
      alert('Failed to upload signature. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setTypedName('');
  };

  const removeSignature = () => {
    setPreviewUrl(null);
    clearSignature();
    if (onRemove) {
      onRemove();
    }
  };

  if (previewUrl) {
    return (
      <div className="signature-preview-container">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-color-text">
            Your Signature
          </label>
          <button
            onClick={removeSignature}
            className="text-xs text-color-danger hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Remove
          </button>
        </div>
        <div className="p-4 bg-white border-2 border-color-border rounded-lg">
          <img
            src={previewUrl}
            alt="Your signature"
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="researcher-signature-container space-y-4">
      <div>
        <label className="text-sm font-medium text-color-text mb-2 block">
          Add Your Signature
        </label>

        {/* Method Selection Tabs */}
        <div className="flex gap-2 mb-4">
          {(['draw', 'type', 'upload'] as const).map(method => (
            <button
              key={method}
              onClick={() => setSignatureMethod(method)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                signatureMethod === method
                  ? 'bg-color-primary text-white border-color-primary'
                  : 'bg-color-bg border-color-border hover:bg-color-surface text-color-text'
              }`}
            >
              {method === 'draw' && <Pen className="w-4 h-4" />}
              {method === 'type' && <Type className="w-4 h-4" />}
              {method === 'upload' && <Upload className="w-4 h-4" />}
              <span className="text-sm capitalize">{method}</span>
            </button>
          ))}
        </div>

        {/* Draw Signature */}
        {signatureMethod === 'draw' && (
          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-color-border rounded-lg p-2 bg-white">
              <div className="absolute top-2 left-2 text-xs text-color-text-tertiary pointer-events-none">
                Draw your signature here
              </div>
              {/* @ts-ignore */}
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#000033"
                canvasProps={{
                  className: 'signature-canvas w-full',
                  style: {
                    width: '100%',
                    height: '150px',
                    cursor: 'crosshair',
                    backgroundColor: 'transparent',
                  },
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearSignature}
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDrawnSignature}
                loading={isSaving}
                disabled={!sigCanvas.current || isSaving}
              >
                <Check className="w-4 h-4 mr-1" />
                Save Signature
              </Button>
            </div>
          </div>
        )}

        {/* Type Signature */}
        {signatureMethod === 'type' && (
          <div className="space-y-3">
            <input
              type="text"
              value={typedName}
              onChange={(e: any) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full px-4 py-3 rounded-lg border border-color-border bg-color-bg text-color-text focus:outline-none focus:ring-2 focus:ring-color-primary/20"
            />

            {typedName && (
              <div className="p-4 bg-white border border-color-border rounded-lg">
                <div
                  style={{
                    fontFamily:
                      '"Brush Script MT", "Lucida Handwriting", "Segoe Script", cursive',
                    fontSize: '42px',
                    fontStyle: 'italic',
                    color: '#000033',
                    textAlign: 'center',
                    lineHeight: '1.2',
                  }}
                >
                  {typedName}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleTypedSignature}
              loading={isSaving}
              disabled={!typedName.trim() || isSaving}
            >
              <Check className="w-4 h-4 mr-1" />
              Use as Signature
            </Button>
          </div>
        )}

        {/* Upload Signature */}
        {signatureMethod === 'upload' && (
          <div className="space-y-3">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="border-2 border-dashed border-color-border rounded-lg p-8 text-center cursor-pointer hover:bg-color-surface transition-colors">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-3 border-color-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-color-text">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2 text-color-text-secondary" />
                    <p className="text-sm text-color-text">
                      Click to upload signature image
                    </p>
                    <p className="text-xs text-color-text-tertiary mt-1">
                      PNG, JPG, or GIF (max 2MB)
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearcherSignature;
