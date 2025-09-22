'use client';

import React, { useState, useCallback } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Save,
  Copy,
  Play,
  Eye,
  Filter,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types for logic system
export interface LogicCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less' | 'between' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty';
  value: any;
  type: 'question' | 'variable' | 'metadata';
}

export interface LogicRule {
  id: string;
  name: string;
  description?: string;
  conditions: LogicCondition[];
  logic: 'AND' | 'OR' | 'CUSTOM';
  customLogic?: string;
  actions: LogicAction[];
  enabled: boolean;
  priority: number;
}

export interface LogicAction {
  id: string;
  type: 'show' | 'hide' | 'skip' | 'require' | 'set_value' | 'pipe_value' | 'validate' | 'calculate' | 'loop' | 'randomize' | 'end_survey';
  target: string;
  value?: any;
  options?: Record<string, any>;
}

export interface BranchingNode {
  id: string;
  questionId: string;
  x: number;
  y: number;
  branches: Branch[];
  isRoot?: boolean;
  isTerminal?: boolean;
}

export interface Branch {
  id: string;
  sourceId: string;
  targetId: string;
  condition: LogicCondition;
  label: string;
  color?: string;
}

// Response piping configuration
export interface PipingConfig {
  enabled: boolean;
  source: string;
  format?: 'text' | 'uppercase' | 'lowercase' | 'capitalize' | 'number' | 'currency' | 'percentage';
  fallback?: string;
  prefix?: string;
  suffix?: string;
}

// Loop and merge configuration
export interface LoopConfig {
  enabled: boolean;
  source: 'question' | 'fixed' | 'variable';
  iterations?: number;
  questionId?: string;
  variable?: string;
  currentIndex?: number;
  fields: string[];
}

// Question pool configuration
export interface PoolConfig {
  enabled: boolean;
  poolSize: number;
  selectionCount: number;
  selectionMethod: 'random' | 'sequential' | 'weighted';
  weights?: Record<string, number>;
  preventDuplicates: boolean;
  groupBy?: string;
}

// Validation rule configuration
export interface ValidationRule {
  id: string;
  name: string;
  type: 'regex' | 'custom' | 'range' | 'length' | 'email' | 'url' | 'phone' | 'date' | 'time' | 'unique';
  pattern?: string;
  min?: number;
  max?: number;
  customFunction?: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

// Logic template
export interface LogicTemplate {
  id: string;
  name: string;
  description: string;
  category: 'screening' | 'branching' | 'piping' | 'validation' | 'calculation' | 'flow';
  icon: React.ElementType;
  rules: LogicRule[];
  variables?: Record<string, any>;
}

// Pre-built logic templates
const logicTemplates: LogicTemplate[] = [
  {
    id: 'age-screening',
    name: 'Age Screening',
    description: 'Screen participants based on age range',
    category: 'screening',
    icon: Filter,
    rules: [
      {
        id: 'age-check',
        name: 'Check Age Eligibility',
        conditions: [
          {
            id: 'c1',
            field: 'age',
            operator: 'between',
            value: [18, 65],
            type: 'question',
          },
        ],
        logic: 'AND',
        actions: [
          {
            id: 'a1',
            type: 'skip',
            target: 'main-survey',
          },
        ],
        enabled: true,
        priority: 1,
      },
    ],
  },
  {
    id: 'satisfaction-branch',
    name: 'Satisfaction Branching',
    description: 'Branch based on satisfaction rating',
    category: 'branching',
    icon: GitBranch,
    rules: [
      {
        id: 'low-satisfaction',
        name: 'Handle Low Satisfaction',
        conditions: [
          {
            id: 'c1',
            field: 'satisfaction',
            operator: 'less',
            value: 3,
            type: 'question',
          },
        ],
        logic: 'AND',
        actions: [
          {
            id: 'a1',
            type: 'show',
            target: 'improvement-questions',
          },
        ],
        enabled: true,
        priority: 1,
      },
    ],
  },
];

// Main BranchingLogicEngine component
export const BranchingLogicEngine: React.FC<{
  questions: any[];
  onLogicUpdate?: (rules: LogicRule[]) => void;
  initialRules?: LogicRule[];
}> = ({ questions, onLogicUpdate, initialRules = [] }) => {
  const [rules, setRules] = useState<LogicRule[]>(initialRules);
  const [selectedRule, setSelectedRule] = useState<LogicRule | null>(null);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, any>>({});

  // Add new rule
  const addRule = useCallback(() => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      conditions: [],
      logic: 'AND',
      actions: [],
      enabled: true,
      priority: rules.length + 1,
    };
    setRules([...rules, newRule]);
    setSelectedRule(newRule);
  }, [rules]);

  // Update rule
  const updateRule = useCallback((ruleId: string, updates: Partial<LogicRule>) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  }, []);

  // Delete rule
  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
    }
  }, [selectedRule]);

  // Add condition to rule
  const addCondition = useCallback((ruleId: string) => {
    const newCondition: LogicCondition = {
      id: `cond-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      type: 'question',
    };
    updateRule(ruleId, {
      conditions: [...(rules.find(r => r.id === ruleId)?.conditions || []), newCondition],
    });
  }, [rules, updateRule]);

  // Add action to rule
  const addAction = useCallback((ruleId: string) => {
    const newAction: LogicAction = {
      id: `action-${Date.now()}`,
      type: 'show',
      target: '',
    };
    updateRule(ruleId, {
      actions: [...(rules.find(r => r.id === ruleId)?.actions || []), newAction],
    });
  }, [rules, updateRule]);

  // Test logic execution
  const testLogic = useCallback(() => {
    const results: Record<string, boolean> = {};
    
    rules.forEach(rule => {
      if (!rule.enabled) return;
      
      let conditionMet = false;
      
      if (rule.logic === 'AND') {
        conditionMet = rule.conditions.every(condition => 
          evaluateCondition(condition, testAnswers)
        );
      } else if (rule.logic === 'OR') {
        conditionMet = rule.conditions.some(condition => 
          evaluateCondition(condition, testAnswers)
        );
      } else if (rule.logic === 'CUSTOM' && rule.customLogic) {
        // Evaluate custom logic expression
        try {
          conditionMet = evaluateCustomLogic(rule.customLogic, rule.conditions, testAnswers);
        } catch (error) {
          console.error('Error evaluating custom logic:', error);
        }
      }
      
      results[rule.id] = conditionMet;
    });
    
    return results;
  }, [rules, testAnswers]);

  // Evaluate single condition
  const evaluateCondition = (condition: LogicCondition, answers: Record<string, any>): boolean => {
    const value = answers[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'greater':
        return Number(value) > Number(condition.value);
      case 'less':
        return Number(value) < Number(condition.value);
      case 'between':
        const [min, max] = condition.value;
        return Number(value) >= Number(min) && Number(value) <= Number(max);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'is_empty':
        return !value || value === '';
      case 'is_not_empty':
        return !!value && value !== '';
      default:
        return false;
    }
  };

  // Evaluate custom logic expression
  const evaluateCustomLogic = (expression: string, conditions: LogicCondition[], answers: Record<string, any>): boolean => {
    // Simple expression evaluator (e.g., "C1 AND (C2 OR C3)")
    let expr = expression;
    conditions.forEach((condition, index) => {
      const result = evaluateCondition(condition, answers);
      expr = expr.replace(new RegExp(`C${index + 1}`, 'g'), String(result));
    });
    
    // Evaluate the boolean expression
    // This is a simplified implementation - in production, use a proper expression parser
    try {
      return Function('"use strict"; return (' + expr.replace(/AND/g, '&&').replace(/OR/g, '||') + ')')();
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={addRule}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {logicTemplates.map(template => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => {
                      setRules([...rules, ...template.rules]);
                    }}
                  >
                    <template.icon className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-gray-200" />

            <Button
              variant={showVisualizer ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowVisualizer(!showVisualizer)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Visualizer
            </Button>

            <Button
              variant={testMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestMode(!testMode)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Test Mode
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {rules.filter(r => r.enabled).length}/{rules.length} Active
            </Badge>
            <Badge variant="outline">
              {questions.length} Questions
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Rules List */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-2">
            {rules.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No logic rules yet</p>
                <p className="text-xs text-gray-400 mt-1">Add a rule to get started</p>
              </div>
            ) : (
              <AnimatePresence>
                {rules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={cn(
                        'p-3 cursor-pointer transition-all border rounded-lg bg-white',
                        selectedRule?.id === rule.id && 'ring-2 ring-blue-500',
                        !rule.enabled && 'opacity-50'
                      )}
                      onClick={() => setSelectedRule(rule)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{rule.name}</h4>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                              P{rule.priority}
                            </Badge>
                          </div>
                          
                          {rule.description && (
                            <p className="text-xs text-gray-500 mb-2">{rule.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{rule.conditions.length} conditions</span>
                            <span>{rule.actions.length} actions</span>
                            <Badge variant="outline" className="text-xs">
                              {rule.logic}
                            </Badge>
                          </div>
                        </div>
                        
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Rule Editor */}
        {selectedRule ? (
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Edit Rule</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={selectedRule.name}
                      onChange={(e) => updateRule(selectedRule.id, { name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-priority">Priority</Label>
                    <Input
                      id="rule-priority"
                      type="number"
                      value={selectedRule.priority}
                      onChange={(e) => updateRule(selectedRule.id, { priority: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={selectedRule.description || ''}
                    onChange={(e) => updateRule(selectedRule.id, { description: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Conditions */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Conditions</h4>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRule.logic}
                        onValueChange={(value) => updateRule(selectedRule.id, { logic: value as any })}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">All (AND)</SelectItem>
                          <SelectItem value="OR">Any (OR)</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCondition(selectedRule.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedRule.logic === 'CUSTOM' && (
                    <div className="mb-3">
                      <Input
                        placeholder="e.g., C1 AND (C2 OR C3)"
                        value={selectedRule.customLogic || ''}
                        onChange={(e) => updateRule(selectedRule.id, { customLogic: e.target.value })}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {selectedRule.conditions.map((condition, index) => (
                      <Card key={condition.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            C{index + 1}
                          </span>
                          
                          <Select value={condition.field} onValueChange={(value) => {
                            const updated = [...selectedRule.conditions];
                            if (updated[index]) updated[index].field = value;
                            updateRule(selectedRule.id, { conditions: updated });
                          }}>
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {questions.map(q => (
                                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={condition.operator} onValueChange={(value) => {
                            const updated = [...selectedRule.conditions];
                            if (updated[index]) updated[index].operator = value as any;
                            updateRule(selectedRule.id, { conditions: updated });
                          }}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not_equals">Not Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="greater">Greater Than</SelectItem>
                              <SelectItem value="less">Less Than</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                              <SelectItem value="is_empty">Is Empty</SelectItem>
                              <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                            <Input
                              className="flex-1 h-8"
                              placeholder="Value"
                              value={condition.value || ''}
                              onChange={(e) => {
                                const updated = [...selectedRule.conditions];
                                if (updated[index]) updated[index].value = e.target.value;
                                updateRule(selectedRule.id, { conditions: updated });
                              }}
                            />
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = selectedRule.conditions.filter((_, i) => i !== index);
                              updateRule(selectedRule.id, { conditions: updated });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Actions</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(selectedRule.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedRule.actions.map((action, index) => (
                      <Card key={action.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <Select value={action.type} onValueChange={(value) => {
                            const updated = [...selectedRule.actions];
                            if (updated[index]) updated[index].type = value as any;
                            updateRule(selectedRule.id, { actions: updated });
                          }}>
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="show">Show</SelectItem>
                              <SelectItem value="hide">Hide</SelectItem>
                              <SelectItem value="skip">Skip To</SelectItem>
                              <SelectItem value="require">Require</SelectItem>
                              <SelectItem value="set_value">Set Value</SelectItem>
                              <SelectItem value="pipe_value">Pipe Value</SelectItem>
                              <SelectItem value="validate">Validate</SelectItem>
                              <SelectItem value="end_survey">End Survey</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select value={action.target} onValueChange={(value) => {
                            const updated = [...selectedRule.actions];
                            if (updated[index]) updated[index].target = value;
                            updateRule(selectedRule.id, { actions: updated });
                          }}>
                            <SelectTrigger className="flex-1 h-8">
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              {questions.map(q => (
                                <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {(action.type === 'set_value' || action.type === 'pipe_value') && (
                            <Input
                              className="w-40 h-8"
                              placeholder="Value"
                              value={action.value || ''}
                              onChange={(e) => {
                                const updated = [...selectedRule.actions];
                                if (updated[index]) updated[index].value = e.target.value;
                                updateRule(selectedRule.id, { actions: updated });
                              }}
                            />
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = selectedRule.actions.filter((_, i) => i !== index);
                              updateRule(selectedRule.id, { actions: updated });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteRule(selectedRule.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Rule
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const duplicate = { ...selectedRule, id: `rule-${Date.now()}`, name: `${selectedRule.name} (Copy)` };
                        setRules([...rules, duplicate]);
                        setSelectedRule(duplicate);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onLogicUpdate?.(rules)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a rule to edit</p>
              <p className="text-sm text-gray-400 mt-1">Or create a new rule to get started</p>
            </div>
          </div>
        )}

        {/* Test Mode Panel */}
        {testMode && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium mb-4">Test Logic</h4>
              
              <div className="space-y-3">
                {questions.map(question => (
                  <div key={question.id}>
                    <Label htmlFor={`test-${question.id}`} className="text-sm">
                      {question.title}
                    </Label>
                    <Input
                      id={`test-${question.id}`}
                      className="mt-1 h-8"
                      placeholder="Enter test value"
                      value={testAnswers[question.id] || ''}
                      onChange={(e) => setTestAnswers({
                        ...testAnswers,
                        [question.id]: e.target.value,
                      })}
                    />
                  </div>
                ))}
              </div>
              
              <Button
                className="w-full mt-4"
                size="sm"
                onClick={() => {
                  const results = testLogic();
                  console.log('Test Results:', results);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Run Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchingLogicEngine;