import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the popup component
vi.mock('@/components/ui/PopupModal', () => ({
  default: ({ children }: any) => <div>{children}</div>,
  usePopup: () => ({
    popupState: { isOpen: false },
    closePopup: vi.fn(),
    showConfirm: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

// Mock the stores
vi.mock('@/lib/stores/study-builder-store', () => ({
  useStudyBuilderStore: () => ({
    setGridConfig: vi.fn(),
    gridConfig: null,
  }),
}));

// Mock the services
vi.mock('@/lib/services/upload.service', () => ({
  uploadLogo: vi.fn(),
  uploadSignature: vi.fn(),
}));

vi.mock('@/lib/services/draft.service', () => ({
  DraftService: {
    getDraft: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    generateDraftId: vi.fn(() => 'test-draft-id'),
    migrateOldDraft: vi.fn(),
  },
}));

// Import the component
import CreateStudyPage from '@/app/(researcher)/studies/create/page';

describe('Study Creation Page - Field Validation', () => {
  it('should display required field indicators correctly', () => {
    render(<CreateStudyPage />);
    
    // Check for required field indicators - the text is split across elements
    const requiredIndicator = screen.getByText(/indicates required fields/);
    expect(requiredIndicator).toBeInTheDocument();
    
    // Check that Study Title has asterisk
    const titleLabel = screen.getByLabelText(/Study Title/);
    expect(titleLabel).toBeInTheDocument();
    
    // Check that description is marked as optional - use getAllByText since there are multiple
    const optionalLabels = screen.getAllByText(/Optional/);
    expect(optionalLabels.length).toBeGreaterThan(0);
    // Specifically check for the label next to description
    const descriptionLabel = screen.getByText('(Optional)');
    expect(descriptionLabel).toBeInTheDocument();
  });

  it('should not show template warnings when no template is selected', () => {
    render(<CreateStudyPage />);
    
    // Template warnings should not be visible initially
    const templateWarning = screen.queryByText(/These templates are suggestions only/);
    expect(templateWarning).not.toBeInTheDocument();
    
    const legalNotice = screen.queryByText(/Legal Notice:/);
    expect(legalNotice).not.toBeInTheDocument();
  });
});