import { Question, QuestionType } from '@/lib/types/questionnaire';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface QuestionnaireState {
  questions: Question[];
  selectedQuestionIds: Set<string>;
  undoStack: Question[][];
  redoStack: Question[][];

  // Actions
  addQuestion: (
    type: QuestionType,
    index?: number,
    data?: Partial<Question>
  ) => Question;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  duplicateQuestion: (id: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;

  // Selection
  selectQuestion: (id: string) => void;
  deselectQuestion: (id: string) => void;
  clearSelection: () => void;

  // Bulk operations
  bulkDeleteQuestions: (ids: string[]) => void;
  copyQuestions: (ids: string[]) => void;
  importQuestions: (questions: Question[]) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Utilities
  saveSnapshot: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  questions: [],
  selectedQuestionIds: new Set(),
  undoStack: [],
  redoStack: [],

  saveSnapshot: () => {
    const { questions, undoStack } = get();
    set({
      undoStack: [...undoStack.slice(-19), [...questions]],
      redoStack: [],
    });
  },

  addQuestion: (type, index, data) => {
    const { questions, saveSnapshot } = get();
    saveSnapshot();

    const now = new Date();
    const newQuestion = {
      id: data?.id || uuidv4(),
      surveyId: data?.surveyId || '',
      type,
      text: data?.text || 'New Question',
      description: data?.description,
      required: data?.required || false,
      order: index !== undefined ? index : questions.length,
      layout: data?.layout || 'vertical',
      theme: data?.theme || 'default',
      animations: data?.animations !== undefined ? data.animations : false,
      version: data?.version || 1,
      isActive: data?.isActive !== undefined ? data.isActive : true,
      createdAt: data?.createdAt || now,
      updatedAt: data?.updatedAt || now,
      options: data?.options,
      validation: data?.validation,
      skipLogic: data?.skipLogic,
      config: data?.config,
      helpText: data?.helpText,
      tags: data?.tags,
      category: data?.category,
      difficulty: data?.difficulty,
      estimatedTime: data?.estimatedTime,
      analytics: data?.analytics,
    } as Question;

    const newQuestions = [...questions];
    if (index !== undefined) {
      newQuestions.splice(index, 0, newQuestion);
      // Update order for subsequent questions
      for (let i = index + 1; i < newQuestions.length; i++) {
        const question = newQuestions[i];
        if (question) {
          question.order = i;
        }
      }
    } else {
      newQuestions.push(newQuestion);
    }

    set({ questions: newQuestions });
    return newQuestion;
  },

  updateQuestion: (id, updates) => {
    const { questions, saveSnapshot } = get();
    saveSnapshot();

    set({
      questions: questions.map((q: any) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  },

  deleteQuestion: id => {
    const { questions, saveSnapshot, selectedQuestionIds } = get();
    saveSnapshot();

    const newQuestions = questions.filter((q: any) => q.id !== id);
    // Update order
    newQuestions.forEach((q, index) => {
      q.order = index;
    });

    const newSelectedIds = new Set(selectedQuestionIds);
    newSelectedIds.delete(id);

    set({
      questions: newQuestions,
      selectedQuestionIds: newSelectedIds,
    });
  },

  duplicateQuestion: id => {
    const { questions, addQuestion } = get();
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const { id: _id, ...questionData } = question;
    const duplicatedQuestion = {
      ...questionData,
      text: `${question.text} (Copy)`,
    };

    addQuestion(question.type, question.order + 1, duplicatedQuestion);
  },

  reorderQuestions: (fromIndex, toIndex) => {
    const { questions, saveSnapshot } = get();
    if (fromIndex === toIndex) return;

    saveSnapshot();

    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    if (!movedQuestion) return;

    newQuestions.splice(toIndex, 0, movedQuestion);

    // Update order
    newQuestions.forEach((q, index) => {
      q.order = index;
    });

    set({ questions: newQuestions });
  },

  selectQuestion: id => {
    const { selectedQuestionIds } = get();
    const newSelectedIds = new Set(selectedQuestionIds);
    newSelectedIds.add(id);
    set({ selectedQuestionIds: newSelectedIds });
  },

  deselectQuestion: id => {
    const { selectedQuestionIds } = get();
    const newSelectedIds = new Set(selectedQuestionIds);
    newSelectedIds.delete(id);
    set({ selectedQuestionIds: newSelectedIds });
  },

  clearSelection: () => {
    set({ selectedQuestionIds: new Set() });
  },

  bulkDeleteQuestions: ids => {
    const { questions, saveSnapshot } = get();
    saveSnapshot();

    const newQuestions = questions.filter((q: any) => !ids.includes(q.id));
    // Update order
    newQuestions.forEach((q, index) => {
      q.order = index;
    });

    set({
      questions: newQuestions,
      selectedQuestionIds: new Set(),
    });
  },

  copyQuestions: ids => {
    const { questions, addQuestion } = get();
    const questionsToCopy = questions.filter((q: any) => ids.includes(q.id));

    questionsToCopy.forEach((question, index) => {
      const { id: _id, ...questionData } = question;
      const copiedQuestion = {
        ...questionData,
        text: `${question.text} (Copy)`,
      };

      addQuestion(question.type, questions.length + index, copiedQuestion);
    });
  },

  importQuestions: newQuestions => {
    const { questions, saveSnapshot } = get();
    saveSnapshot();

    const importedQuestions = newQuestions.map((q, index) => ({
      ...q,
      id: uuidv4(),
      order: questions.length + index,
    }));

    set({ questions: [...questions, ...importedQuestions] });
  },

  undo: () => {
    const { undoStack, redoStack, questions } = get();
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    if (!previousState) return;

    set({
      questions: previousState,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, questions],
    });
  },

  redo: () => {
    const { undoStack, redoStack, questions } = get();
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    if (!nextState) return;

    set({
      questions: nextState,
      undoStack: [...undoStack, questions],
      redoStack: redoStack.slice(0, -1),
    });
  },
}));
