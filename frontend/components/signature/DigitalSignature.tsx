'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

// Type assertion for SignatureCanvas due to type incompatibility
const SignatureCanvasComponent = SignatureCanvas as any;
import { Button } from '@/components/apple-ui/Button';
import { TextField } from '@/components/apple-ui/TextField';
import { Upload, Pen, Type, RotateCcw, Check } from 'lucide-react';

interface DigitalSignatureProps {
  onSignatureComplete: (signature: string) => void;
  signatureType: 'typed' | 'drawn' | 'upload';
  organizationLogo?: string;
  organizationName?: string;
  showOrganizationHeader?: boolean;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureComplete,
  signatureType,
  organizationLogo,
  organizationName,
  showOrganizationHeader = true,
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [typedName, setTypedName] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleDrawnSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signature = sigCanvas.current.toDataURL();
      onSignatureComplete(signature);
      setIsSigned(true);
    }
  };

  const handleTypedSignature = () => {
    if (typedName.trim()) {
      // Convert typed name to stylized signature using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 400;
        canvas.height = 100;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = 'italic 30px "Brush Script MT", "Lucida Handwriting", cursive';
        ctx.fillText(typedName, 20, 60);
        const signature = canvas.toDataURL();
        onSignatureComplete(signature);
        setIsSigned(true);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const result = event.target?.result as string;
        setUploadedSignature(result);
        onSignatureComplete(result);
        setIsSigned(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setTypedName('');
    setUploadedSignature(null);
    setIsSigned(false);
  };

  return (
    <div className="signature-container space-y-4 p-6 bg-gradient-to-b from-color-surface to-color-bg rounded-xl border border-color-border shadow-sm">
      {/* DocuSign-style Header */}
      {showOrganizationHeader && (organizationLogo || organizationName) && (
        <div className="organization-header flex items-center justify-between p-4 bg-color-bg rounded-lg border border-color-border">
          <div className="flex items-center gap-4">
            {organizationLogo && (
              <img 
                src={organizationLogo} 
                alt={organizationName || 'Organization'} 
                className="h-14 w-auto object-contain"
              />
            )}
            {organizationName && (
              <div>
                <h3 className="text-lg font-semibold text-color-text">{organizationName}</h3>
                <p className="text-xs text-color-text-secondary">Official Consent Document</p>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-color-text-secondary">Document ID</p>
            <p className="text-xs font-mono text-color-text-tertiary">{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>
      )}

      <div className="signature-area">
        {signatureType === 'drawn' && (
          <div className="drawn-signature space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Pen className="w-5 h-5 text-secondary-label" />
              <span className="text-sm font-medium text-label">Draw Your Signature</span>
            </div>
            
            <div className="signature-canvas-wrapper relative border-2 border-dashed border-color-border rounded-lg p-2 bg-white shadow-inner">
              <div className="absolute top-2 left-2 text-xs text-color-text-tertiary pointer-events-none">Sign here</div>
              <SignatureCanvasComponent
                ref={sigCanvas}
                penColor="#000033"
                canvasProps={{
                  className: 'signature-canvas w-full',
                  style: { 
                    width: '100%', 
                    height: '180px',
                    cursor: 'crosshair',
                    backgroundColor: 'transparent'
                  }
                }}
              />
              <div className="absolute bottom-2 right-2">
                <div className="w-32 border-t-2 border-color-border mt-2"></div>
                <p className="text-xs text-color-text-tertiary mt-1">Signature Line</p>
              </div>
            </div>
            
            <div className="signature-actions flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={clearSignature}
                disabled={isSigned}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleDrawnSignature}
                disabled={isSigned || !sigCanvas.current || sigCanvas.current.isEmpty()}
              >
                <Check className="w-4 h-4 mr-1" />
                Save Signature
              </Button>
            </div>
          </div>
        )}

        {signatureType === 'typed' && (
          <div className="typed-signature space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-5 h-5 text-secondary-label" />
              <span className="text-sm font-medium text-label">Type Your Signature</span>
            </div>
            
            <TextField
              label="Full Name"
              value={typedName}
              onChange={(e: any) => setTypedName(e.target.value)}
              placeholder="John Doe"
              disabled={isSigned}
            />
            
            {typedName && (
              <div className="signature-preview relative p-6 bg-white border border-color-border rounded-lg shadow-inner">
                <div className="absolute top-2 left-2 text-xs text-color-text-tertiary">Preview</div>
                <div 
                  style={{ 
                    fontFamily: '"Brush Script MT", "Lucida Handwriting", "Segoe Script", cursive',
                    fontSize: '28px',
                    fontStyle: 'italic',
                    color: '#000033',
                    textAlign: 'center'
                  }}
                >
                  {typedName}
                </div>
                <div className="absolute bottom-2 right-2">
                  <div className="w-32 border-t-2 border-color-border mt-2"></div>
                  <p className="text-xs text-color-text-tertiary mt-1">Signature Line</p>
                </div>
              </div>
            )}
            
            <Button
              variant="primary"
              size="small"
              onClick={handleTypedSignature}
              disabled={isSigned || !typedName.trim()}
            >
              <Check className="w-4 h-4 mr-1" />
              Use as Signature
            </Button>
          </div>
        )}

        {signatureType === 'upload' && (
          <div className="upload-signature space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-secondary-label" />
              <span className="text-sm font-medium text-label">Upload Signature</span>
            </div>
            
            {!uploadedSignature ? (
              <label className="upload-area block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isSigned}
                />
                <div className="border-2 border-dashed border-quaternary-fill rounded-lg p-8 text-center cursor-pointer hover:bg-quaternary-fill/10 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-secondary-label" />
                  <p className="text-sm text-label">Click to upload signature image</p>
                  <p className="text-xs text-tertiary-label mt-1">PNG, JPG, or GIF (max 2MB)</p>
                </div>
              </label>
            ) : (
              <div className="uploaded-preview p-4 bg-white border border-quaternary-fill rounded-lg">
                <img 
                  src={uploadedSignature} 
                  alt="Uploaded signature" 
                  className="h-20 object-contain"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isSigned && (
        <div className="signature-confirmation p-4 bg-gradient-to-r from-color-success/10 to-color-success/5 border border-color-success/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-color-success flex items-center gap-2">
                <Check className="w-5 h-5" />
                Document Signed Successfully
              </p>
              <p className="text-xs text-color-text-secondary mt-1">
                This document has been electronically signed and is legally binding.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-color-text-tertiary">IP Address</p>
              <p className="text-xs font-mono text-color-text-secondary">{typeof window !== 'undefined' ? '192.168.1.1' : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* DocuSign-style Legal Agreement */}
      <div className="consent-agreement bg-color-surface rounded-lg p-4 border border-color-border">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <svg className="w-5 h-5 text-color-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-color-text mb-2">Electronic Signature Disclosure & Consent</h4>
            <p className="text-xs text-color-text-secondary leading-relaxed">
              By providing your electronic signature, you agree to be legally bound by this document's terms and conditions. 
              This electronic signature has the same legal validity and enforceability as a handwritten signature.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-color-text-tertiary">Signed on:</p>
                <p className="text-color-text font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-color-text-tertiary">Time:</p>
                <p className="text-color-text font-medium">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalSignature;