/**
 * Academic Resources Constants
 * Phase 10.91 Day 12 - Extracted from AcademicResourcesPanel.tsx
 *
 * Centralized configuration for academic databases and metadata
 */

// ============================================================================
// Types
// ============================================================================

export interface AcademicDatabase {
  id: string;
  label: string;
  icon: string;
  desc: string;
  category: 'Free' | 'Premium';
}

// ============================================================================
// Academic Database Sources Configuration
// ============================================================================

/**
 * Complete list of supported academic databases
 *
 * Categories:
 * - Free (9 sources): Open access, no authentication required
 * - Premium (9 sources): Requires institutional access or API keys
 *
 * Total: 18 academic databases covering all major fields
 */
export const ACADEMIC_DATABASES: AcademicDatabase[] = [
  // ========== FREE & OPEN ACCESS ==========
  {
    id: 'pubmed',
    label: 'PubMed',
    icon: '🏥',
    desc: '~36M papers • Medicine & Life Sciences',
    category: 'Free',
  },
  {
    id: 'pmc',
    label: 'PubMed Central',
    icon: '📖',
    desc: '~10M papers • Full-text biomedical articles',
    category: 'Free',
  },
  {
    id: 'arxiv',
    label: 'ArXiv',
    icon: '📐',
    desc: '~2.4M papers • Physics, Math, CS preprints',
    category: 'Free',
  },
  {
    id: 'semantic_scholar',
    label: 'Semantic Scholar',
    icon: '🎓',
    desc: '~220M papers • AI-powered search, all fields',
    category: 'Free',
  },
  {
    id: 'ssrn',
    label: 'SSRN',
    icon: '📊',
    desc: '~1.2M papers • Social sciences & humanities',
    category: 'Free',
  },
  {
    id: 'crossref',
    label: 'CrossRef',
    icon: '🔗',
    desc: '~150M records • DOI registry, all fields',
    category: 'Free',
  },
  {
    id: 'eric',
    label: 'ERIC',
    icon: '🎓',
    desc: '~1.7M papers • Education research database',
    category: 'Free',
  },
  {
    id: 'core',
    label: 'CORE',
    icon: '🌍',
    desc: '~250M papers • Open access aggregator from 10,000+ repositories',
    category: 'Free',
  },
  {
    id: 'springer',
    label: 'SpringerLink Open Access',
    icon: '📚',
    desc: '~15M papers • Springer Nature open access publications',
    category: 'Free',
  },

  // ========== PREMIUM (REQUIRES AUTH) ==========
  {
    id: 'google_scholar',
    label: 'Google Scholar',
    icon: '🔍',
    desc: '~400M documents • Multidisciplinary search',
    category: 'Premium',
  },
  {
    id: 'web_of_science',
    label: 'Web of Science',
    icon: '🌐',
    desc: '~95M papers • Citation analytics, all sciences',
    category: 'Premium',
  },
  {
    id: 'scopus',
    label: 'Scopus',
    icon: '🔬',
    desc: '~90M papers • Peer-reviewed, SJR rankings',
    category: 'Premium',
  },
  {
    id: 'ieee_xplore',
    label: 'IEEE Xplore',
    icon: '⚡',
    desc: '~6M papers • Engineering, CS & electronics',
    category: 'Premium',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '⭐',
    desc: '~500K papers • High-impact research (IF ~69)',
    category: 'Premium',
  },
  {
    id: 'wiley',
    label: 'Wiley Online Library',
    icon: '🔬',
    desc: '~9M papers • Medicine, engineering & sciences',
    category: 'Premium',
  },
  {
    id: 'sage',
    label: 'SAGE Publications',
    icon: '📖',
    desc: '~1.5M papers • Social sciences focus',
    category: 'Premium',
  },
  {
    id: 'taylor_francis',
    label: 'Taylor & Francis',
    icon: '📚',
    desc: '~4M papers • Humanities & social sciences',
    category: 'Premium',
  },
];

/**
 * Get databases by category
 */
export const FREE_DATABASES = ACADEMIC_DATABASES.filter(db => db.category === 'Free');
export const PREMIUM_DATABASES = ACADEMIC_DATABASES.filter(db => db.category === 'Premium');

/**
 * Get database by ID
 */
export const getDatabaseById = (id: string): AcademicDatabase | undefined => {
  return ACADEMIC_DATABASES.find(db => db.id === id);
};

/**
 * Count databases by category
 */
export const DATABASE_COUNTS = {
  FREE: FREE_DATABASES.length,
  PREMIUM: PREMIUM_DATABASES.length,
  TOTAL: ACADEMIC_DATABASES.length,
} as const;
