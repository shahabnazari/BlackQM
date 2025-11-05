/**
 * Academic Source Icons - Black & White SVG logos
 * Real, recognizable icons for academic databases
 */

import React from 'react';

interface IconProps {
  className?: string;
}

export const PubMedIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* PubMed stylized P */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h3v2h-3v6h-2v-6H8V9h3V7z" />
  </svg>
);

export const ArxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stylized arXiv symbol */}
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.45 3.73L12 11.63 4.55 7.91 12 4.18zM4 9.72l7 3.5v7.1l-7-3.5v-7.1zm16 0v7.1l-7 3.5v-7.1l7-3.5z" />
  </svg>
);

export const SemanticScholarIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Graduation cap / scholar symbol */}
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
  </svg>
);

export const CrossRefIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Crosshair/link symbol */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v3h4v-3l5 5-5 5v-3h-4v3z" />
  </svg>
);

export const BioRxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* DNA helix symbol */}
    <path d="M7 2v2h10V2H7zm0 4v2h10V6H7zm0 4v2h10v-2H7zm0 4v2h10v-2H7zm0 4v2h10v-2H7z" />
    <path d="M5 4h2v16H5V4zm12 0h2v16h-2V4z" />
  </svg>
);

export const WebOfScienceIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Globe with network symbol */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

export const ScopusIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Magnifying glass over document */}
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    <circle
      cx="16"
      cy="16"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M18.5 18.5L21 21" strokeWidth="1.5" stroke="currentColor" />
  </svg>
);

export const IEEEIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Electrical circuit symbol */}
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.12 6 2.12v4.78z" />
    <path d="M9 9h6v2H9zm0 3h6v2H9z" />
  </svg>
);

export const JSTORIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Book/library symbol */}
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z" />
  </svg>
);

export const SpringerIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* S shape / book */}
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h12v16zM8 6h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" />
  </svg>
);

export const NatureIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* N / Microscope */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <path d="M10 7v10l5-5z" />
  </svg>
);

export const WileyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* W / Books */}
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z" />
  </svg>
);

export const ScienceDirectIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Arrow/forward symbol */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 4-4v3h4V8l4 4-4 4v-3h-4v3z" />
  </svg>
);

export const PsycINFOIcon: React.FC<IconProps> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Brain/psychology symbol */}
    <path d="M13 3C9.23 3 6.19 5.95 6 9.66l-1.92.58c-1.33.4-2.08 1.8-1.63 3.1L3 15v5c0 1.1.9 2 2 2h10c1.66 0 3-1.34 3-3v-1.54c1.87-.82 3-2.64 3-4.46 0-1.89-1.08-3.51-2.6-4.36C18.68 5.07 16.16 3 13 3zm-2 14H7v-2h4v2zm0-4H7v-2h4v2zm6 0h-4v-2h4v2z" />
  </svg>
);

export const ERICIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Education / school symbol */}
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
  </svg>
);

// Icon mapping object
export const academicSourceIcons: Record<string, React.FC<IconProps>> = {
  pubmed: PubMedIcon,
  arxiv: ArxivIcon,
  semantic_scholar: SemanticScholarIcon,
  crossref: CrossRefIcon,
  biorxiv: BioRxivIcon,
  web_of_science: WebOfScienceIcon,
  scopus: ScopusIcon,
  ieee: IEEEIcon,
  jstor: JSTORIcon,
  springer: SpringerIcon,
  nature: NatureIcon,
  wiley: WileyIcon,
  elsevier: ScienceDirectIcon,
  psycinfo: PsycINFOIcon,
  eric: ERICIcon,
};

// Helper to get icon component
export const getAcademicIcon = (sourceId: string) => {
  return academicSourceIcons[sourceId] || SemanticScholarIcon;
};
