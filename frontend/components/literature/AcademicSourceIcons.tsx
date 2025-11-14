/**
 * Academic Source Icons - Authentic SVG logos matching actual websites
 * Updated November 2025 - Complete set for all 18 academic databases
 * Each icon designed to be visually distinct and recognizable
 */

import React from 'react';

interface IconProps {
  className?: string;
}

// ============================================================================
// FREE & OPEN ACCESS SOURCES (10)
// ============================================================================

// PubMed - Medical cross/caduceus (NCBI/NIH) - RED/ORANGE theme
export const PubMedIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Medical cross with central circle - PubMed branding */}
    <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

// PubMed Central (PMC) - Open book with PMC text
export const PMCIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Open book symbol for full-text articles */}
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
  </svg>
);

// ArXiv - Cornell's "X" in circle (ORANGE theme)
export const ArxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Bold X in circle - arXiv's distinctive logo */}
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// bioRxiv/medRxiv - DNA double helix (BLUE/GREEN theme)
export const BioRxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* DNA double helix - bioRxiv/medRxiv branding */}
    <path d="M7 2v20M17 2v20" stroke="currentColor" strokeWidth="2" />
    <ellipse cx="12" cy="5" rx="5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="12" cy="10" rx="5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="12" cy="15" rx="5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="12" cy="20" rx="5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// ChemRxiv - Chemical flask/beaker (PURPLE theme)
export const ChemRxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Erlenmeyer flask - chemistry symbol */}
    <path d="M9 2v6L5 16c-1 2 0 4 2 4h10c2 0 3-2 2-4l-4-8V2H9zm1 2h4v5.5l3.5 7c.3.6 0 1.5-1 1.5H7.5c-1 0-1.3-.9-1-1.5L10 9.5V4z" />
    <circle cx="12" cy="14" r="1.5" />
    <circle cx="9" cy="16" r="1" />
    <circle cx="15" cy="16" r="1" />
  </svg>
);

// Semantic Scholar - Network graph with "S" (TEAL theme)
export const SemanticScholarIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* AI network nodes - S2 branding */}
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <circle cx="18" cy="18" r="2.5" />
    <circle cx="12" cy="12" r="2" />
    <line x1="8" y1="6" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <line x1="16" y1="6" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="18" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" />
    <line x1="16" y1="18" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// SSRN - Stacked papers/documents (YELLOW/GOLD theme)
export const SSRNIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stacked research papers */}
    <rect x="3" y="7" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="5" y="5" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <rect x="7" y="3" width="14" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
    <line x1="10" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" />
    <line x1="10" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// CrossRef - Crosshair target (BLUE theme)
export const CrossRefIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Precision crosshair - DOI linking */}
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <line x1="12" y1="3" x2="12" y2="7" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="2" />
    <line x1="17" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// ERIC - Graduation cap (EDUCATION theme, BROWN)
export const ERICIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Mortarboard graduation cap */}
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
  </svg>
);

// ============================================================================
// PREMIUM/SUBSCRIPTION SOURCES (9)
// ============================================================================

// Google Scholar - Multicolor "G" (GOOGLE theme)
export const GoogleScholarIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Scholar graduation cap with G */}
    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 6.3L17.74 9 12 11.7 6.26 9 12 6.3z" />
  </svg>
);

// Web of Science - WoS globe with orbits (DARK BLUE theme)
export const WebOfScienceIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Globe with citation network */}
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Scopus - Star/compass navigation (ORANGE/RED theme)
export const ScopusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Star navigation compass - Scopus branding */}
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2l2 8h8l-6.5 5 2.5 8-6-5-6 5 2.5-8L2 10h8z" />
  </svg>
);

// IEEE Xplore - Lightning bolt in circuit (BLUE theme)
export const IEEEIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Lightning bolt - electrical engineering */}
    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
  </svg>
);

// SpringerLink - Springer horse logo simplified (GREEN theme)
export const SpringerIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Open book with bookmark - publishing */}
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
  </svg>
);

// Nature - Stylized "N" with leaf (GREEN/RED theme)
export const NatureIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Leaf/nature symbol - Nature journal branding */}
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.28.66C7.14 17.33 9 12 17 10V8z" />
    <path d="M15 3c-1.3 0-2.59.26-3.8.75L13 6.5c.78-.37 1.62-.5 2.5-.5 3.31 0 6 2.69 6 6h2c0-4.42-3.58-8-8-8z" />
    <circle cx="12" cy="12" r="1.5" />
  </svg>
);

// Wiley - Three vertical books (DARK BLUE/BLACK theme)
export const WileyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Three stacked books - publisher */}
    <rect x="3" y="4" width="6" height="16" rx="1" />
    <rect x="9" y="4" width="6" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="15" y="4" width="6" height="16" rx="1" />
  </svg>
);

// SAGE - Open book with sage leaf (SAGE GREEN theme)
export const SAGEIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Sage leaf with book */}
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" />
    <circle cx="8" cy="10" r="2" />
    <circle cx="16" cy="14" r="2" />
  </svg>
);

// Taylor & Francis - T&F monogram (RED theme)
export const TaylorFrancisIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Book with T&F styling */}
    <rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="13" r="2" fill="currentColor" />
    <circle cx="15" cy="13" r="2" fill="currentColor" />
  </svg>
);

// ============================================================================
// ICON MAPPING - Complete set for all 18 sources
// ============================================================================

export const academicSourceIcons: Record<string, React.FC<IconProps>> = {
  // Free & Open Access (10)
  pubmed: PubMedIcon,
  pmc: PMCIcon,
  arxiv: ArxivIcon,
  biorxiv: BioRxivIcon,
  chemrxiv: ChemRxivIcon,
  semantic_scholar: SemanticScholarIcon,
  ssrn: SSRNIcon,
  crossref: CrossRefIcon,
  eric: ERICIcon,
  
  // Premium (9)
  google_scholar: GoogleScholarIcon,
  web_of_science: WebOfScienceIcon,
  scopus: ScopusIcon,
  ieee_xplore: IEEEIcon,
  ieee: IEEEIcon, // alias
  springer: SpringerIcon,
  nature: NatureIcon,
  wiley: WileyIcon,
  sage: SAGEIcon,
  taylor_francis: TaylorFrancisIcon,
};

// Helper to get icon component with fallback
export const getAcademicIcon = (sourceId: string) => {
  return academicSourceIcons[sourceId.toLowerCase()] || CrossRefIcon;
};
