export interface StudyDraft {
  id: string;
  title: string;
  config: any;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft';
}

export class DraftService {
  private static DRAFT_KEY_PREFIX = 'study_draft_';
  private static DRAFTS_LIST_KEY = 'study_drafts_list';

  // Save a draft with explicit ID
  static saveDraft(draftId: string, config: any): void {
    const draft: StudyDraft = {
      id: draftId,
      title: config.title || 'Untitled Draft',
      config,
      createdAt: this.getDraft(draftId)?.createdAt || new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };

    // Save draft content
    localStorage.setItem(`${this.DRAFT_KEY_PREFIX}${draftId}`, JSON.stringify(draft));
    
    // Update drafts list
    const drafts = this.getAllDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draftId);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }
    
    localStorage.setItem(this.DRAFTS_LIST_KEY, JSON.stringify(drafts));
  }

  // Get a specific draft
  static getDraft(draftId: string): StudyDraft | null {
    const draftStr = localStorage.getItem(`${this.DRAFT_KEY_PREFIX}${draftId}`);
    if (!draftStr) return null;
    
    try {
      return JSON.parse(draftStr);
    } catch (e: any) {
      console.error('Failed to parse draft:', e);
      return null;
    }
  }

  // Get all drafts
  static getAllDrafts(): StudyDraft[] {
    const draftsStr = localStorage.getItem(this.DRAFTS_LIST_KEY);
    if (!draftsStr) return [];
    
    try {
      return JSON.parse(draftsStr);
    } catch (e: any) {
      console.error('Failed to parse drafts list:', e);
      return [];
    }
  }

  // Delete a draft
  static deleteDraft(draftId: string): void {
    // Remove draft content
    localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${draftId}`);
    
    // Update drafts list
    const drafts = this.getAllDrafts();
    const filtered = drafts.filter((d: any) => d.id !== draftId);
    localStorage.setItem(this.DRAFTS_LIST_KEY, JSON.stringify(filtered));
  }

  // Clear all drafts
  static clearAllDrafts(): void {
    const drafts = this.getAllDrafts();
    drafts.forEach(draft => {
      localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${draft.id}`);
    });
    localStorage.removeItem(this.DRAFTS_LIST_KEY);
  }

  // Clean up old drafts (older than 7 days)
  static cleanupOldDrafts(daysOld: number = 7): void {
    const drafts = this.getAllDrafts();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const activeDrafts = drafts.filter((draft: any) => {
      const draftDate = new Date(draft.updatedAt);
      if (draftDate < cutoffDate) {
        localStorage.removeItem(`${this.DRAFT_KEY_PREFIX}${draft.id}`);
        return false;
      }
      return true;
    });
    
    localStorage.setItem(this.DRAFTS_LIST_KEY, JSON.stringify(activeDrafts));
  }

  // Generate a new draft ID
  static generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Migrate old draft format to new format
  static migrateOldDraft(): string | null {
    const oldDraft = localStorage.getItem('study_draft');
    if (!oldDraft) return null;
    
    try {
      const config = JSON.parse(oldDraft);
      const newDraftId = this.generateDraftId();
      this.saveDraft(newDraftId, config);
      
      // Remove old draft
      localStorage.removeItem('study_draft');
      
      return newDraftId;
    } catch (e: any) {
      console.error('Failed to migrate old draft:', e);
      return null;
    }
  }
}