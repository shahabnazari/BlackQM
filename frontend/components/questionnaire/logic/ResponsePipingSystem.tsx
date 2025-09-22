'use client';

import React, { useState, useCallback } from 'react';
import {
  Link,
  Type,
  Hash,
  Calendar,
  DollarSign,
  Percent,
  Mail,
  Phone,
  Plus,
  X,
  ChevronRight,
  Copy,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Piping variable types
export type PipingVariableType = 'question' | 'metadata' | 'calculation' | 'system' | 'custom';

export interface PipingVariable {
  id: string;
  name: string;
  type: PipingVariableType;
  source: string;
  format?: string;
  fallback?: string;
  transform?: string;
  validation?: string;
  description?: string;
}

export interface PipingRule {
  id: string;
  targetField: string;
  targetType: 'text' | 'title' | 'description' | 'option' | 'validation';
  template: string;
  variables: PipingVariable[];
  conditions?: any[];
  enabled: boolean;
}

export interface FormatOption {
  id: string;
  label: string;
  icon: React.ElementType;
  transform: (value: any) => string;
}

// Predefined format options
const formatOptions: FormatOption[] = [
  {
    id: 'text',
    label: 'Plain Text',
    icon: Type,
    transform: (value) => String(value),
  },
  {
    id: 'uppercase',
    label: 'UPPERCASE',
    icon: Type,
    transform: (value) => String(value).toUpperCase(),
  },
  {
    id: 'lowercase',
    label: 'lowercase',
    icon: Type,
    transform: (value) => String(value).toLowerCase(),
  },
  {
    id: 'capitalize',
    label: 'Capitalize',
    icon: Type,
    transform: (value) => {
      return String(value)
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    },
  },
  {
    id: 'number',
    label: 'Number',
    icon: Hash,
    transform: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? '0' : num.toLocaleString();
    },
  },
  {
    id: 'currency',
    label: 'Currency',
    icon: DollarSign,
    transform: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
    },
  },
  {
    id: 'percentage',
    label: 'Percentage',
    icon: Percent,
    transform: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? '0%' : `${(num * 100).toFixed(1)}%`;
    },
  },
  {
    id: 'date',
    label: 'Date',
    icon: Calendar,
    transform: (value) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    },
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    transform: (value) => String(value).toLowerCase().trim(),
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: Phone,
    transform: (value) => {
      const cleaned = String(value).replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
    },
  },
];

// System variables
const systemVariables = [
  { id: 'current_date', name: 'Current Date', value: () => new Date().toLocaleDateString() },
  { id: 'current_time', name: 'Current Time', value: () => new Date().toLocaleTimeString() },
  { id: 'participant_id', name: 'Participant ID', value: () => 'PARTICIPANT_ID' },
  { id: 'study_name', name: 'Study Name', value: () => 'STUDY_NAME' },
  { id: 'completion_percentage', name: 'Completion %', value: () => '0%' },
];

// Main ResponsePipingSystem component
export const ResponsePipingSystem: React.FC<{
  questions: any[];
  onPipingUpdate?: (rules: PipingRule[]) => void;
  initialRules?: PipingRule[];
}> = ({ questions, onPipingUpdate, initialRules = [] }) => {
  const [rules, setRules] = useState<PipingRule[]>(initialRules);
  const [selectedRule, setSelectedRule] = useState<PipingRule | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('rules');

  // Add new piping rule
  const addRule = useCallback(() => {
    const newRule: PipingRule = {
      id: `pipe-${Date.now()}`,
      targetField: '',
      targetType: 'text',
      template: '',
      variables: [],
      enabled: true,
    };
    setRules([...rules, newRule]);
    setSelectedRule(newRule);
  }, [rules]);

  // Update rule
  const updateRule = useCallback((ruleId: string, updates: Partial<PipingRule>) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
    if (selectedRule?.id === ruleId) {
      setSelectedRule({ ...selectedRule, ...updates });
    }
  }, [selectedRule]);

  // Delete rule
  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
    }
  }, [selectedRule]);

  // Add variable to template
  const addVariable = useCallback((variable: PipingVariable) => {
    if (!selectedRule) return;
    
    const placeholder = `{{${variable.id}}}`;
    const updatedTemplate = selectedRule.template + placeholder;
    const updatedVariables = [...selectedRule.variables, variable];
    
    updateRule(selectedRule.id, {
      template: updatedTemplate,
      variables: updatedVariables,
    });
  }, [selectedRule, updateRule]);

  // Process template with variables
  const processTemplate = useCallback((template: string, variables: PipingVariable[], data: Record<string, any>): string => {
    let processed = template;
    
    variables.forEach(variable => {
      const placeholder = `{{${variable.id}}}`;
      let value = data[variable.source] || variable.fallback || '';
      
      // Apply format transformation
      if (variable.format) {
        const formatter = formatOptions.find(f => f.id === variable.format);
        if (formatter) {
          value = formatter.transform(value);
        }
      }
      
      // Apply custom transformation
      if (variable.transform) {
        try {
          value = new Function('value', variable.transform)(value);
        } catch (error) {
          console.error('Transform error:', error);
        }
      }
      
      processed = processed.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processed;
  }, []);

  // Generate preview
  const generatePreview = useCallback(() => {
    if (!selectedRule) return '';
    return processTemplate(selectedRule.template, selectedRule.variables, testData);
  }, [selectedRule, testData, processTemplate]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">Response Piping</h3>
            <Badge variant="secondary">
              {rules.filter(r => r.enabled).length} Active
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={addRule}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Rules List */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="m-2">
              <TabsTrigger value="rules" className="flex-1">Rules</TabsTrigger>
              <TabsTrigger value="variables" className="flex-1">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="flex-1 overflow-y-auto p-2 m-0">
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No piping rules</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={cn(
                        'p-3 cursor-pointer transition-all border rounded-lg bg-white',
                        selectedRule?.id === rule.id && 'ring-2 ring-blue-500'
                      )}
                      onClick={() => setSelectedRule(rule)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">
                            {questions.find(q => q.id === rule.targetField)?.title || 'No target'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rule.variables.length} variable{rule.variables.length !== 1 && 's'}
                          </div>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="variables" className="flex-1 overflow-y-auto p-2 m-0">
              <div className="space-y-4">
                {/* Question Variables */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Questions</h4>
                  <div className="space-y-1">
                    {questions.map(question => (
                      <div
                        key={question.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (selectedRule) {
                            addVariable({
                              id: question.id,
                              name: question.title,
                              type: 'question',
                              source: question.id,
                            });
                          }
                        }}
                      >
                        <span className="text-sm">{question.title}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Variables */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">System</h4>
                  <div className="space-y-1">
                    {systemVariables.map(variable => (
                      <div
                        key={variable.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          if (selectedRule) {
                            addVariable({
                              id: variable.id,
                              name: variable.name,
                              type: 'system',
                              source: variable.id,
                            });
                          }
                        }}
                      >
                        <span className="text-sm">{variable.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Rule Editor */}
        {selectedRule ? (
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="p-6 max-w-3xl mx-auto">
              {/* Target Selection */}
              <div className="mb-6">
                <Label>Target Question</Label>
                <Select
                  value={selectedRule.targetField}
                  onValueChange={(value) => updateRule(selectedRule.id, { targetField: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select target question" />
                  </SelectTrigger>
                  <SelectContent>
                    {questions.map(q => (
                      <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Type */}
              <div className="mb-6">
                <Label>Apply To</Label>
                <Select
                  value={selectedRule.targetType}
                  onValueChange={(value) => updateRule(selectedRule.id, { targetType: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Question Text</SelectItem>
                    <SelectItem value="title">Question Title</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="option">Option Labels</SelectItem>
                    <SelectItem value="validation">Validation Message</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Editor */}
              <div className="mb-6">
                <Label>Template</Label>
                <Textarea
                  className="mt-1 font-mono text-sm"
                  rows={4}
                  value={selectedRule.template}
                  onChange={(e) => updateRule(selectedRule.id, { template: e.target.value })}
                  placeholder="Enter template text. Use {{variable_id}} for variables."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Insert variables by clicking them in the sidebar or typing {`{{variable_id}}`}
                </p>
              </div>

              {/* Variables Configuration */}
              {selectedRule.variables.length > 0 && (
                <div className="mb-6">
                  <Label>Variable Configuration</Label>
                  <div className="space-y-2 mt-2">
                    {selectedRule.variables.map((variable, index) => (
                      <Card key={variable.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {`{{${variable.id}}}`}
                              </code>
                              <span className="text-sm font-medium">{variable.name}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Format</Label>
                                <Select
                                  value={variable.format || 'text'}
                                  onValueChange={(value) => {
                                    const updated = [...selectedRule.variables];
                                    if (updated[index]) updated[index].format = value;
                                    updateRule(selectedRule.id, { variables: updated });
                                  }}
                                >
                                  <SelectTrigger className="h-8 mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {formatOptions.map(format => (
                                      <SelectItem key={format.id} value={format.id}>
                                        <div className="flex items-center gap-2">
                                          <format.icon className="w-3 h-3" />
                                          {format.label}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label className="text-xs">Fallback</Label>
                                <Input
                                  className="h-8 mt-1"
                                  placeholder="Default value"
                                  value={variable.fallback || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedRule.variables];
                                    if (updated[index]) updated[index].fallback = e.target.value;
                                    updateRule(selectedRule.id, { variables: updated });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = selectedRule.variables.filter((_, i) => i !== index);
                              updateRule(selectedRule.id, { variables: updated });
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRule(selectedRule.id)}
                >
                  Delete Rule
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const duplicate = {
                        ...selectedRule,
                        id: `pipe-${Date.now()}`,
                      };
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
                    onClick={() => onPipingUpdate?.(rules)}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Link className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a rule to edit</p>
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && selectedRule && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium mb-4">Preview</h4>

              {/* Test Data Inputs */}
              <div className="space-y-3 mb-4">
                {selectedRule.variables.map(variable => (
                  <div key={variable.id}>
                    <Label className="text-sm">{variable.name}</Label>
                    <Input
                      className="mt-1 h-8"
                      placeholder="Enter test value"
                      value={testData[variable.source] || ''}
                      onChange={(e) => setTestData({
                        ...testData,
                        [variable.source]: e.target.value,
                      })}
                    />
                  </div>
                ))}
              </div>

              {/* Preview Output */}
              <Card className="p-3 bg-gray-50">
                <Label className="text-xs text-gray-500">Output</Label>
                <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">
                    {generatePreview() || 'Enter test values to see preview'}
                  </p>
                </div>
              </Card>

              <Button
                className="w-full mt-4"
                size="sm"
                variant="outline"
                onClick={() => setTestData({})}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Test Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePipingSystem;