'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import ReactFlow, {
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  GitBranch, 
  Filter, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle,
  ChevronRight,
  Layers
} from 'lucide-react';
import { QuestionType } from '@/lib/types/questionnaire';

interface SkipLogic {
  conditions: Array<{
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    action: 'show' | 'hide' | 'skip_to';
    targetQuestion?: string;
  }>;
}

interface VisualSkipLogicBuilderProps {
  questions: Array<{
    id: string;
    type: QuestionType;
    text: string;
    required?: boolean;
    options?: Array<{ text: string; value: string }>;
    logic?: SkipLogic;
  }>;
  onUpdateLogic: (questionId: string, logic: SkipLogic) => void;
  selectedQuestionId?: string;
}

// Custom node component for questions
const QuestionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE_SINGLE:
      case QuestionType.MULTIPLE_CHOICE_MULTI:
        return '📝';
      case QuestionType.LIKERT_SCALE:
      case QuestionType.RATING_SCALE:
        return '⭐';
      case QuestionType.TEXT_SHORT:
      case QuestionType.TEXT_LONG:
        return '💬';
      case QuestionType.NET_PROMOTER_SCORE:
        return '📊';
      default:
        return '❓';
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 min-w-[200px] transition-all',
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800"
      />
      
      <div className="flex items-start gap-2">
        <span className="text-lg">{getQuestionIcon(data.type)}</span>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Q{data.order + 1}
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
            {data.text}
          </div>
          {data.required && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500">Required</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
};

// Custom node for logic conditions
const ConditionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="px-3 py-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-yellow-500"
      />
      
      <div className="flex items-center gap-2">
        <Filter className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
        <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
          {data.operator} {data.value}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-yellow-500"
      />
    </div>
  );
};

// Custom node for section/group
const SectionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 min-w-[250px]">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {data.label}
        </span>
      </div>
    </div>
  );
};

const nodeTypes = {
  question: QuestionNode,
  condition: ConditionNode,
  section: SectionNode
};

export const VisualSkipLogicBuilder: React.FC<VisualSkipLogicBuilderProps> = ({
  questions,
  onUpdateLogic,
  selectedQuestionId
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(selectedQuestionId || null);
  const [showConditionPanel, setShowConditionPanel] = useState(false);
  const [currentCondition, setCurrentCondition] = useState<any>(null);

  // Convert questions to flow nodes
  const nodes = useMemo<Node[]>(() => {
    const flowNodes: Node[] = [];
    let yPosition = 0;

    questions.forEach((question, index) => {
      // Add question node
      flowNodes.push({
        id: question.id,
        type: 'question',
        position: { x: 250, y: yPosition },
        data: {
          ...question,
          order: index
        }
      });

      // Add condition nodes if logic exists
      if (question.logic?.conditions) {
        question.logic.conditions.forEach((condition, condIndex) => {
          const conditionId = `${question.id}-condition-${condIndex}`;
          flowNodes.push({
            id: conditionId,
            type: 'condition',
            position: { x: 500, y: yPosition + condIndex * 80 },
            data: condition
          });
        });
      }

      yPosition += 150;
    });

    return flowNodes;
  }, [questions]);

  // Create edges based on skip logic
  const edges = useMemo<Edge[]>(() => {
    const flowEdges: Edge[] = [];

    // Create linear flow between questions
    for (let i = 0; i < questions.length - 1; i++) {
      flowEdges.push({
        id: `e-${questions[i].id}-${questions[i + 1].id}`,
        source: questions[i].id,
        target: questions[i + 1].id,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        animated: false
      });
    }

    // Add conditional edges
    questions.forEach(question => {
      if (question.logic?.conditions) {
        question.logic.conditions.forEach((condition, index) => {
          const conditionId = `${question.id}-condition-${index}`;
          
          // Edge from question to condition
          flowEdges.push({
            id: `e-${question.id}-${conditionId}`,
            source: question.id,
            target: conditionId,
            type: 'smoothstep',
            style: { stroke: '#fbbf24', strokeWidth: 2 },
            animated: true,
            label: 'IF',
            labelStyle: { fontSize: 10, fontWeight: 600 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#fbbf24'
            }
          });

          // Edge from condition to target
          if (condition.targetQuestion) {
            flowEdges.push({
              id: `e-${conditionId}-${condition.targetQuestion}`,
              source: conditionId,
              target: condition.targetQuestion,
              type: 'smoothstep',
              style: { stroke: '#10b981', strokeWidth: 2 },
              animated: true,
              label: condition.action.toUpperCase(),
              labelStyle: { fontSize: 10, fontWeight: 600 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#10b981'
              }
            });
          }
        });
      }
    });

    return flowEdges;
  }, [questions]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    if (node.type === 'question') {
      setShowConditionPanel(true);
    }
  }, []);

  const handleAddCondition = useCallback(() => {
    if (!selectedNodeId) return;

    const newCondition = {
      questionId: selectedNodeId,
      operator: 'equals' as const,
      value: '',
      action: 'show' as const,
      targetQuestion: undefined
    };

    setCurrentCondition(newCondition);
  }, [selectedNodeId]);

  const handleSaveCondition = useCallback(() => {
    if (!selectedNodeId || !currentCondition) return;

    const question = questions.find(q => q.id === selectedNodeId);
    if (!question) return;

    const existingLogic = question.logic || { conditions: [] };
    const updatedLogic = {
      ...existingLogic,
      conditions: [...existingLogic.conditions, currentCondition]
    };

    onUpdateLogic(selectedNodeId, updatedLogic);
    setCurrentCondition(null);
  }, [selectedNodeId, currentCondition, questions, onUpdateLogic]);

  return (
    <div className="h-full flex">
      {/* Main Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background color="#e5e7eb" gap={20} />
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <MiniMap 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              nodeColor={node => {
                if (node.type === 'question') return '#3b82f6';
                if (node.type === 'condition') return '#fbbf24';
                return '#6b7280';
              }}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Condition Panel */}
      {showConditionPanel && selectedNodeId && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Skip Logic
            </h3>
            <button
              onClick={() => setShowConditionPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Selected Question */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Question
            </label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {questions.find(q => q.id === selectedNodeId)?.text}
              </p>
            </div>
          </div>

          {/* Existing Conditions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Existing Conditions
            </h4>
            {questions.find(q => q.id === selectedNodeId)?.logic?.conditions?.map((condition, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {condition.operator} {condition.value} → {condition.action}
                  </span>
                  <button className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) || <p className="text-sm text-gray-500">No conditions set</p>}
          </div>

          {/* Add New Condition */}
          {currentCondition ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Condition
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  If answer
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  value={currentCondition.operator}
                  onChange={(e) => setCurrentCondition({
                    ...currentCondition,
                    operator: e.target.value as any
                  })}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  value={currentCondition.value}
                  onChange={(e) => setCurrentCondition({
                    ...currentCondition,
                    value: e.target.value
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Then
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  value={currentCondition.action}
                  onChange={(e) => setCurrentCondition({
                    ...currentCondition,
                    action: e.target.value as any
                  })}
                >
                  <option value="show">Show Question</option>
                  <option value="hide">Hide Question</option>
                  <option value="skip_to">Skip To Question</option>
                </select>
              </div>

              {currentCondition.action === 'skip_to' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Question
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    value={currentCondition.targetQuestion || ''}
                    onChange={(e) => setCurrentCondition({
                      ...currentCondition,
                      targetQuestion: e.target.value
                    })}
                  >
                    <option value="">Select question...</option>
                    {questions
                      .filter(q => q.id !== selectedNodeId)
                      .map(q => (
                        <option key={q.id} value={q.id}>
                          {q.text}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveCondition}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Condition
                </button>
                <button
                  onClick={() => setCurrentCondition(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAddCondition}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </button>
          )}
        </div>
      )}
    </div>
  );
};