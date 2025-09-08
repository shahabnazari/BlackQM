'use client';

import React from 'react';

interface ResearcherBrandingProps {
  researcherName?: string;
  researcherTitle?: string;
  researcherSignatureUrl?: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  position?: 'top' | 'bottom';
  variant?: 'full' | 'compact';
}

export const ResearcherBranding: React.FC<ResearcherBrandingProps> = ({
  researcherName,
  researcherTitle,
  researcherSignatureUrl,
  organizationName,
  organizationLogoUrl,
  position = 'bottom',
  variant = 'full',
}) => {
  // Don't render if no branding information is provided
  if (!researcherName && !organizationLogoUrl && !researcherSignatureUrl && !organizationName) {
    return null;
  }

  const isTop = position === 'top';
  
  return (
    <div 
      className={`researcher-branding ${
        isTop ? 'mb-8' : 'mt-8'
      } py-6 px-8 bg-gradient-to-r from-color-surface/50 to-color-bg border ${
        isTop ? 'border-b-2' : 'border-t-2'
      } border-color-border`}
    >
      {variant === 'full' ? (
        // Full variant for consent forms
        <div className="flex items-end justify-between gap-6">
          {/* Organization Section */}
          <div className="flex items-center gap-4">
            {organizationLogoUrl && (
              <img 
                src={organizationLogoUrl} 
                alt={organizationName || 'Organization'} 
                className="h-20 w-auto object-contain"
              />
            )}
            <div>
              {organizationName && (
                <h3 className="text-lg font-semibold text-color-text">
                  {organizationName}
                </h3>
              )}
              {researcherName && (
                <p className="text-base text-color-text mt-1">
                  {researcherName}
                </p>
              )}
              {researcherTitle && (
                <p className="text-sm text-color-text-secondary">
                  {researcherTitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Signature Section */}
          {researcherSignatureUrl && (
            <div className="text-right">
              <img 
                src={researcherSignatureUrl} 
                alt="Signature" 
                className="h-16 w-auto object-contain ml-auto mb-1"
              />
              <div className="w-40 border-t-2 border-color-border"></div>
              <p className="text-sm text-color-text mt-2">{researcherName}</p>
              <p className="text-xs text-color-text-tertiary">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Compact variant for welcome pages
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {organizationLogoUrl && (
              <img 
                src={organizationLogoUrl} 
                alt={organizationName || 'Organization'} 
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              {organizationName && (
                <p className="text-sm font-semibold text-color-text">
                  {organizationName}
                </p>
              )}
              {researcherName && (
                <p className="text-xs text-color-text-secondary">
                  {researcherName}{researcherTitle ? `, ${researcherTitle}` : ''}
                </p>
              )}
            </div>
          </div>
          
          {researcherSignatureUrl && (
            <img 
              src={researcherSignatureUrl} 
              alt="Signature" 
              className="h-10 w-auto object-contain opacity-80"
            />
          )}
        </div>
      )}
      
      {/* Optional certification text for consent forms */}
      {variant === 'full' && isTop && (
        <div className="mt-4 pt-4 border-t border-color-border">
          <p className="text-xs text-color-text-tertiary text-center">
            This research study has been reviewed and approved by the Institutional Review Board (IRB)
          </p>
        </div>
      )}
    </div>
  );
};

export default ResearcherBranding;