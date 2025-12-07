# Generator Code Snippets & Integration Points

## Quick Integration Reference

### 1. Statement Generator

**Backend Entry Point:**
```typescript
// /backend/src/modules/ai/services/statement-generator.service.ts
async generateStatements(
  topic: string,
  options: StatementGenerationOptions = {},
  userId?: string
): Promise<Statement[]>

// Options interface
interface StatementGenerationOptions {
  count?: number;              // 10-100
  perspectives?: string[];     // e.g., ['Environmental activist', 'Industry worker']
  avoidBias?: boolean;
  academicLevel?: 'basic' | 'intermediate' | 'advanced';
  maxLength?: number;
}
```

**Frontend Hook:**
```typescript
// /frontend/components/ai/StatementGenerator.tsx
const { loading, error, execute: generateStatementsFromBackend } = useGenerateStatements();

// Usage
const result = await generateStatementsFromBackend({
  topic,
  count,
  perspectives: validPerspectives,
  avoidBias,
  academicLevel
});
```

**Advanced Methods (Not in UI):**
```typescript
// These are backend-only - need UI components
await validateStatements(statements, topic)
await suggestNeutralAlternative(statement)
await generatePerspectiveGuidelines(topic)
await enhanceStatements(statements, 'clarity' | 'balance' | 'diversity')
await checkCulturalSensitivity(statements, targetRegions)
await generateStatementVariations(statement, count)
await generateStatementsFromMultiPlatform(themes, studyContext)
```

---

### 2. Questionnaire Generator

**Backend Entry Point:**
```typescript
// /backend/src/modules/ai/services/questionnaire-generator.service.ts
async generateQuestionnaire(
  studyTopic: string,
  questionCount: number,
  questionTypes: string[],  // 'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic'
  targetAudience: string | undefined,
  includeSkipLogic: boolean,
  userId: string
): Promise<GeneratedQuestion[]>

interface GeneratedQuestion {
  id: string;
  text: string;
  type: 'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic';
  options?: string[];
  required: boolean;
  skipLogic?: {
    condition: string;
    targetQuestionId: string;
  };
  confidence: number;
  reasoning: string;
}
```

**Frontend Status:** 🔴 MISSING - No UI component exists

**To Build Frontend:**
```typescript
// This component doesn't exist yet - needs to be created
<QuestionnaireGenerator
  studyTopic={topic}
  questionCount={20}
  questionTypes={['likert', 'multipleChoice']}
  targetAudience="researchers"
  onQuestionsGenerated={(questions) => {
    // Store or use questions
  }}
/>
```

---

### 3. Research Question Generator

**Backend Entry Point:**
```typescript
// /backend/src/modules/research-design/services/research-question.service.ts
async refineQuestion(
  request: QuestionAnalysisRequest
): Promise<RefinedQuestion>

interface QuestionAnalysisRequest {
  question: string;
  literatureSummary?: {
    papers: any[];
    themes: any[];
    gaps: any[];
  };
  domain?: string;
  methodology?: 'q-methodology' | 'mixed-methods' | 'qualitative' | 'quantitative';
}

interface RefinedQuestion {
  id: string;
  originalQuestion: string;
  refinedQuestion: string;
  squareitScore: SQUAREITScore;  // 8 dimensions, each 0-10
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    relevance: string;
  }>;
  gaps: Array<{
    id: string;
    description: string;
    importance: number;
  }>;
  subQuestions: SubQuestion[];
  improvementSuggestions: string[];
  confidenceScore: number;
  createdAt: Date;
}
```

**Frontend Integration:** ✓ COMPLETE
```typescript
// /frontend/app/(researcher)/design/questions/page.tsx
// 6-step wizard fully implemented:
// 1. Topic selection
// 2. Question type selection
// 3. Components definition
// 4. Refinement with suggestions
// 5. Validation checklist
// 6. Summary with exports

export default function ResearchQuestionWizardPage() {
  // Uses AI-powered suggestions
  const generateQuestionSuggestions = () => {
    // Generates 3-5 template-based suggestions
  };
}
```

---

### 4. Hypothesis Generator

**Backend Entry Point:**
```typescript
// /backend/src/modules/research-design/services/hypothesis-generator.service.ts
async generateHypotheses(
  request: HypothesisGenerationRequest
): Promise<GeneratedHypothesis[]>

interface HypothesisGenerationRequest {
  researchQuestion: string;
  literatureSummary: {
    papers: any[];
    themes: any[];
    gaps: any[];
    contradictions?: any[];
    trends?: any[];
  };
  domain?: string;
}

interface GeneratedHypothesis {
  id: string;
  type: 'null' | 'alternative' | 'directional';
  statement: string;
  source: 'contradiction' | 'gap' | 'trend';
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    evidenceType: 'supports' | 'contradicts' | 'mixed';
    excerpt?: string;
  }>;
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest?: string;
  confidenceScore: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  priority: number;
  createdAt: Date;
}
```

**Frontend Integration:** ⚠️ PARTIAL
```typescript
// /frontend/components/research-design/HypothesisBuilderPanel.tsx
// Displays results from generateHypotheses()
// Missing: Theory diagram visualization, methodology recommendations

// /frontend/app/(researcher)/design/hypothesis/page.tsx
// Provides manual hypothesis builder with templates
// Missing: Integration with literature-derived hypotheses
```

**Advanced Backend Methods (Not in UI):**
```typescript
// These exist but have no UI components
async buildTheoryDiagram(
  researchQuestion: string,
  themes: any[],
  knowledgeGraphData?: any
): Promise<TheoryDiagram>

async recommendMethodology(
  researchQuestion: string,
  hypotheses: GeneratedHypothesis[],
  themes: any[]
): Promise<MethodologyRecommendation>
```

---

### 5. Theme-to-Survey-Item Generator

**Backend Entry Point:**
```typescript
// /backend/src/modules/literature/services/theme-to-survey-item.service.ts
async generateSurveyItems(
  options: GenerateSurveyItemsOptions
): Promise<SurveyItemGenerationResult>

interface GenerateSurveyItemsOptions {
  themes: Theme[];
  itemType: 'likert' | 'multiple_choice' | 'semantic_differential' | 'matrix_grid' | 'rating_scale' | 'mixed';
  scaleType?: '1-5' | '1-7' | '1-10' | 'agree-disagree' | 'frequency' | 'satisfaction';
  itemsPerTheme?: number;        // Default: 3
  includeReverseCoded?: boolean; // Default: true
  researchContext?: string;
  targetAudience?: string;
}

interface SurveyItemGenerationResult {
  items: SurveyItem[];
  summary: {
    totalItems: number;
    itemsByType: Record<string, number>;
    reverseCodedCount: number;
    averageConfidence: number;
  };
  methodology: {
    approach: string;
    researchBacking: string;
    validation: string;
    reliability: string;
  };
  recommendations: {
    pilotTesting: string;
    reliabilityAnalysis: string;
    validityChecks: string;
  };
}
```

**Frontend Status:** 🔴 MISSING - No UI component exists

**API Service Exists:**
```typescript
// /frontend/lib/api/services/theme-to-survey.service.ts
// exists but needs UI wrapper

// To use it:
import { themeToSurveyService } from '@/lib/api/services/theme-to-survey.service';

const result = await themeToSurveyService.generateSurveyItems({
  themes: extractedThemes,
  itemType: 'likert',
  scaleType: '1-5',
  itemsPerTheme: 3,
  includeReverseCoded: true,
  researchContext: 'Leadership in remote teams'
});
```

---

## Recommended UI Component Structures

### Missing: QuestionnaireGenerator Component

```typescript
// Recommended file: /frontend/components/questionnaire/QuestionnaireGenerator.tsx

interface QuestionnaireGeneratorProps {
  studyTopic: string;
  onQuestionsGenerated?: (questions: GeneratedQuestion[]) => void;
  onValidationResult?: (validation: ValidationResult) => void;
}

export function QuestionnaireGenerator(props: QuestionnaireGeneratorProps) {
  // Step 1: Question configuration
  // - Question count (slider 5-50)
  // - Question type selector (checkboxes for 5 types)
  // - Target audience dropdown
  // - Skip logic toggle

  // Step 2: Question list
  // - Reorderable list of generated questions
  // - Edit each question text
  // - Validate quality (button to call backend validation)

  // Step 3: Skip logic builder
  // - Visual editor for skip logic branches
  // - Condition builder (if/then)
  // - Question routing preview

  // Step 4: Export
  // - SPSS syntax
  // - Qualtrics JSON
  // - SurveyMonkey format
}
```

### Missing: ThemeToSurveyGenerator Component

```typescript
// Recommended file: /frontend/components/questionnaire/ThemeToSurveyGenerator.tsx

interface ThemeToSurveyGeneratorProps {
  themes: Theme[];
  onItemsGenerated?: (items: SurveyItem[]) => void;
}

export function ThemeToSurveyGenerator(props: ThemeToSurveyGeneratorProps) {
  // Step 1: Configuration
  // - Item type selector (5 radio options)
  // - Items per theme slider (1-7)
  // - Scale type selector (dropdown)
  // - Reverse-coded items checkbox
  // - Research context textarea

  // Step 2: Item preview
  // - Grouped by theme
  // - Show Likert scales, MC options, etc.
  // - Toggle reverse-coded items visibility
  // - Cronbach's alpha display

  // Step 3: Item editing
  // - Edit item text
  // - Edit response options
  // - Delete/reorder items
  // - View psychometric notes

  // Step 4: Export
  // - SPSS syntax
  // - Excel format
  // - Qualtrics JSON
  // - CSV for import
}
```

### Missing: HypothesisTheoryDiagram Component

```typescript
// Recommended file: /frontend/components/research-design/HypothesisTheoryDiagram.tsx

interface HypothesisTheoryDiagramProps {
  theoryDiagram: TheoryDiagram;
  hypotheses: GeneratedHypothesis[];
  methodologyRecommendation: MethodologyRecommendation;
}

export function HypothesisTheoryDiagram(props: HypothesisTheoryDiagramProps) {
  // Visualize:
  // 1. Network graph of constructs and relationships
  //    - Nodes: constructs
  //    - Edges: relationships (colors by type: causes, influences, etc.)
  //    - Edge thickness: strength (weak/moderate/strong)

  // 2. Q-Methodology recommendation
  //    - Suitability score (0-10) visualization
  //    - Recommended parameters:
  //      * Statement count
  //      * P-set size
  //      * Factor count
  //      * Grid shape
  //    - Alternative methodologies comparison

  // 3. Hypothesis list with connections to theory
  //    - Which hypotheses test which relationships
}
```

---

## API Service Integration Pattern

**Pattern Used Throughout:**

```typescript
// /frontend/hooks/useAIBackend.ts - Custom hook pattern
export function useGenerateStatements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) throw new Error('Generation failed');
      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}
```

---

## Backend API Endpoints (Inferred)

```
POST /api/ai/statements/generate
POST /api/ai/statements/validate
POST /api/ai/statements/enhance
POST /api/ai/statements/variations

POST /api/ai/questionnaire/generate
POST /api/ai/questionnaire/validate

POST /api/research-design/questions/refine
POST /api/research-design/questions/analyze

POST /api/research-design/hypotheses/generate
POST /api/research-design/hypotheses/theory-diagram
POST /api/research-design/hypotheses/methodology-recommendation

POST /api/literature/survey-items/generate
```

---

## Testing Checklist

### To Verify Complete Integration:

- [ ] Statement Generator: Can validate and enhance generated statements
- [ ] Questionnaire: Can preview skip logic before using
- [ ] Research Question: Can export to multiple formats
- [ ] Hypothesis: Can visualize theory diagram and see methodology recommendations
- [ ] Theme-to-Survey: Can build complete survey from themes

### To Verify UI Components:

- [ ] All generators show loading states during generation
- [ ] All generators handle errors gracefully
- [ ] All generators allow editing of results
- [ ] All generators support exporting in 2+ formats
- [ ] All generators show quality/confidence metrics

