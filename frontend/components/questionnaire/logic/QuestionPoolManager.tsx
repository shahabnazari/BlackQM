'use client';

import React, { useState, useCallback } from 'react';
import {
  Shuffle,
  Layers,
  Plus,
  Trash2,
  Save,
  X,
  RefreshCw,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  BarChart3,
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Types for question pooling
export interface QuestionPool {
  id: string;
  name: string;
  description?: string;
  questions: string[];
  selectionMethod: 'random' | 'sequential' | 'weighted' | 'stratified' | 'adaptive';
  selectionCount: number;
  weights?: Record<string, number>;
  conditions?: PoolCondition[];
  stratification?: StratificationConfig;
  adaptiveConfig?: AdaptiveConfig;
  enabled: boolean;
  allowRepeat: boolean;
  minSpacing?: number;
  maxRepeats?: number;
}

export interface PoolCondition {
  id: string;
  type: 'include' | 'exclude' | 'require';
  field: string;
  operator: string;
  value: any;
}

export interface StratificationConfig {
  enabled: boolean;
  groups: StratificationGroup[];
  distribution: 'equal' | 'proportional' | 'custom';
  customDistribution?: Record<string, number>;
}

export interface StratificationGroup {
  id: string;
  name: string;
  questions: string[];
  targetCount?: number;
  targetPercentage?: number;
}

export interface AdaptiveConfig {
  enabled: boolean;
  algorithm: 'irt' | 'cat' | 'custom';
  difficulty: 'ascending' | 'descending' | 'adaptive';
  startingDifficulty: number;
  stopCriteria: {
    maxQuestions?: number;
    minAccuracy?: number;
    maxStandardError?: number;
    timeLimit?: number;
  };
}

// Loop and merge configuration
export interface LoopMergeConfig {
  id: string;
  name: string;
  source: 'list' | 'question' | 'number' | 'roster';
  iterations?: number;
  sourceQuestion?: string;
  sourceList?: string[];
  roster?: RosterItem[];
  randomize: boolean;
  fields: LoopField[];
  enabled: boolean;
}

export interface RosterItem {
  id: string;
  fields: Record<string, any>;
}

export interface LoopField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'custom';
  required: boolean;
}

// Randomization configuration
export interface RandomizationConfig {
  id: string;
  name: string;
  type: 'questions' | 'options' | 'blocks' | 'pages';
  target: string[];
  method: 'simple' | 'block' | 'latin-square' | 'balanced';
  constraints?: RandomizationConstraint[];
  seed?: string;
  preserveFirst?: number;
  preserveLast?: number;
  enabled: boolean;
}

export interface RandomizationConstraint {
  id: string;
  type: 'position' | 'sequence' | 'distance' | 'group';
  items: string[];
  rule: string;
  value?: any;
}

// Main QuestionPoolManager component
export const QuestionPoolManager: React.FC<{
  questions: any[];
  onPoolUpdate?: (pools: QuestionPool[], randomization: RandomizationConfig[]) => void;
  initialPools?: QuestionPool[];
  initialRandomization?: RandomizationConfig[];
}> = ({ questions, onPoolUpdate, initialPools = [], initialRandomization = [] }) => {
  const [pools, setPools] = useState<QuestionPool[]>(initialPools);
  const [randomizations, setRandomizations] = useState<RandomizationConfig[]>(initialRandomization);
  const [selectedPool, setSelectedPool] = useState<QuestionPool | null>(null);
  // const [selectedRandomization, setSelectedRandomization] = useState<RandomizationConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'pools' | 'randomization' | 'loop'>('pools');
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [showSimulation, setShowSimulation] = useState(false);

  // Add new pool
  const addPool = useCallback(() => {
    const newPool: QuestionPool = {
      id: `pool-${Date.now()}`,
      name: 'New Question Pool',
      questions: [],
      selectionMethod: 'random',
      selectionCount: 1,
      enabled: true,
      allowRepeat: false,
    };
    setPools([...pools, newPool]);
    setSelectedPool(newPool);
  }, [pools]);

  // Update pool
  const updatePool = useCallback((poolId: string, updates: Partial<QuestionPool>) => {
    setPools(prev =>
      prev.map(pool =>
        pool.id === poolId ? { ...pool, ...updates } : pool
      )
    );
    if (selectedPool?.id === poolId) {
      setSelectedPool({ ...selectedPool, ...updates });
    }
  }, [selectedPool]);

  // Delete pool
  const deletePool = useCallback((poolId: string) => {
    setPools(prev => prev.filter(pool => pool.id !== poolId));
    if (selectedPool?.id === poolId) {
      setSelectedPool(null);
    }
  }, [selectedPool]);

  // Add randomization config
  const addRandomization = useCallback(() => {
    const newConfig: RandomizationConfig = {
      id: `rand-${Date.now()}`,
      name: 'New Randomization',
      type: 'questions',
      target: [],
      method: 'simple',
      enabled: true,
    };
    setRandomizations([...randomizations, newConfig]);
  }, [randomizations]);

  // Simulate pool selection
  const simulatePoolSelection = useCallback((pool: QuestionPool, iterations: number = 10) => {
    const results: any[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const selected: string[] = [];
      const available = [...pool.questions];
      
      if (pool.selectionMethod === 'random') {
        for (let j = 0; j < Math.min(pool.selectionCount, available.length); j++) {
          const index = Math.floor(Math.random() * available.length);
          if (available[index]) selected.push(available[index]);
          if (!pool.allowRepeat) {
            available.splice(index, 1);
          }
        }
      } else if (pool.selectionMethod === 'weighted' && pool.weights) {
        // Weighted selection
        const weightedList: string[] = [];
        available.forEach(q => {
          const weight = pool.weights?.[q] || 1;
          for (let k = 0; k < weight; k++) {
            weightedList.push(q);
          }
        });
        
        for (let j = 0; j < Math.min(pool.selectionCount, available.length); j++) {
          const index = Math.floor(Math.random() * weightedList.length);
          if (weightedList[index]) selected.push(weightedList[index]);
        }
      } else if (pool.selectionMethod === 'sequential') {
        // Sequential selection
        for (let j = 0; j < Math.min(pool.selectionCount, available.length); j++) {
          const item = available[j];
          if (item) selected.push(item);
        }
      }
      
      results.push({
        iteration: i + 1,
        selected,
        count: selected.length,
      });
    }
    
    return results;
  }, []);

  // Calculate question distribution
  const calculateDistribution = useCallback((results: any[]) => {
    const distribution: Record<string, number> = {};
    
    results.forEach(result => {
      result.selected.forEach((q: string) => {
        distribution[q] = (distribution[q] || 0) + 1;
      });
    });
    
    return distribution;
  }, []);

  const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'pools' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('pools')}
              >
                <Layers className="w-4 h-4 mr-2" />
                Question Pools
              </Button>
              <Button
                variant={activeTab === 'randomization' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('randomization')}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Randomization
              </Button>
              <Button
                variant={activeTab === 'loop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('loop')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Loop & Merge
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'pools' && (
              <>
                <Badge variant="secondary">
                  {pools.filter(p => p.enabled).length}/{pools.length} Active
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSimulation(!showSimulation)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Simulate
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={addPool}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pool
                </Button>
              </>
            )}
            
            {activeTab === 'randomization' && (
              <Button
                variant="default"
                size="sm"
                onClick={addRandomization}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Randomization
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'pools' && (
          <>
            {/* Pools List */}
            <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 space-y-2">
                {pools.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No question pools</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {pools.map((pool, index) => (
                      <motion.div
                        key={pool.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div
                          className={cn(
                            'p-3 cursor-pointer transition-all border rounded-lg bg-white',
                            selectedPool?.id === pool.id && 'ring-2 ring-blue-500',
                            !pool.enabled && 'opacity-50'
                          )}
                          onClick={() => setSelectedPool(pool)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">{pool.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{pool.questions.length} questions</span>
                                <span>Select {pool.selectionCount}</span>
                                <Badge variant="outline" className="text-xs">
                                  {pool.selectionMethod}
                                </Badge>
                              </div>
                            </div>
                            <Switch
                              checked={pool.enabled}
                              onCheckedChange={(checked) => updatePool(pool.id, { enabled: checked })}
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

            {/* Pool Editor */}
            {selectedPool ? (
              <div className="flex-1 bg-gray-50 overflow-y-auto">
                <div className="p-6 max-w-3xl mx-auto">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Pool Configuration</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="pool-name">Pool Name</Label>
                        <Input
                          id="pool-name"
                          value={selectedPool.name}
                          onChange={(e) => updatePool(selectedPool.id, { name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="selection-count">Selection Count</Label>
                        <Input
                          id="selection-count"
                          type="number"
                          min="1"
                          max={selectedPool.questions.length || 1}
                          value={selectedPool.selectionCount}
                          onChange={(e) => updatePool(selectedPool.id, { selectionCount: Number(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <Label htmlFor="pool-description">Description</Label>
                      <Textarea
                        id="pool-description"
                        value={selectedPool.description || ''}
                        onChange={(e) => updatePool(selectedPool.id, { description: e.target.value })}
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    {/* Selection Method */}
                    <div className="mb-6">
                      <Label>Selection Method</Label>
                      <Select
                        value={selectedPool.selectionMethod}
                        onValueChange={(value) => updatePool(selectedPool.id, { selectionMethod: value as any })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random Selection</SelectItem>
                          <SelectItem value="sequential">Sequential Order</SelectItem>
                          <SelectItem value="weighted">Weighted Random</SelectItem>
                          <SelectItem value="stratified">Stratified Sampling</SelectItem>
                          <SelectItem value="adaptive">Adaptive Testing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question Selection */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <Label>Questions in Pool</Label>
                        <Badge variant="secondary">
                          {selectedPool.questions.length} selected
                        </Badge>
                      </div>
                      
                      <Card className="p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {questions.map(question => {
                            const isSelected = selectedPool.questions.includes(question.id);
                            const weight = selectedPool.weights?.[question.id] || 1;
                            
                            return (
                              <div
                                key={question.id}
                                className={cn(
                                  'flex items-center justify-between p-2 rounded transition-colors',
                                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                )}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Switch
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updatePool(selectedPool.id, {
                                          questions: [...selectedPool.questions, question.id],
                                        });
                                      } else {
                                        updatePool(selectedPool.id, {
                                          questions: selectedPool.questions.filter(q => q !== question.id),
                                        });
                                      }
                                    }}
                                  />
                                  <span className="text-sm">{question.title}</span>
                                </div>
                                
                                {selectedPool.selectionMethod === 'weighted' && isSelected && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Weight:</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={weight}
                                      onChange={(e) => {
                                        updatePool(selectedPool.id, {
                                          weights: {
                                            ...selectedPool.weights,
                                            [question.id]: Number(e.target.value),
                                          },
                                        });
                                      }}
                                      className="w-16 h-7"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>

                    {/* Advanced Options */}
                    <div className="mb-6">
                      <Label>Advanced Options</Label>
                      <Card className="p-4 mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="allow-repeat" className="text-sm font-normal">
                            Allow Repeated Selection
                          </Label>
                          <Switch
                            id="allow-repeat"
                            checked={selectedPool.allowRepeat}
                            onCheckedChange={(checked) => updatePool(selectedPool.id, { allowRepeat: checked })}
                          />
                        </div>
                        
                        {selectedPool.allowRepeat && (
                          <>
                            <div>
                              <Label htmlFor="max-repeats" className="text-sm">
                                Maximum Repeats per Question
                              </Label>
                              <Input
                                id="max-repeats"
                                type="number"
                                min="1"
                                value={selectedPool.maxRepeats || 3}
                                onChange={(e) => updatePool(selectedPool.id, { maxRepeats: Number(e.target.value) })}
                                className="mt-1 h-8"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="min-spacing" className="text-sm">
                                Minimum Question Spacing
                              </Label>
                              <Input
                                id="min-spacing"
                                type="number"
                                min="0"
                                value={selectedPool.minSpacing || 0}
                                onChange={(e) => updatePool(selectedPool.id, { minSpacing: Number(e.target.value) })}
                                className="mt-1 h-8"
                              />
                            </div>
                          </>
                        )}
                      </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePool(selectedPool.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Pool
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const results = simulatePoolSelection(selectedPool, 20);
                            setSimulationResults(results);
                            setShowSimulation(true);
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Test Pool
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onPoolUpdate?.(pools, randomizations)}
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
                  <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a pool to configure</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'randomization' && (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Randomization Settings</h3>
              
              <div className="space-y-4">
                {randomizations.map(config => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-gray-500">
                          {config.type} randomization using {config.method} method
                        </p>
                      </div>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => {
                          setRandomizations(prev =>
                            prev.map(r =>
                              r.id === config.id ? { ...r, enabled: checked } : r
                            )
                          );
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Type</Label>
                        <Select value={config.type}>
                          <SelectTrigger className="mt-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="questions">Question Order</SelectItem>
                            <SelectItem value="options">Option Order</SelectItem>
                            <SelectItem value="blocks">Block Order</SelectItem>
                            <SelectItem value="pages">Page Order</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Method</Label>
                        <Select value={config.method}>
                          <SelectTrigger className="mt-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple Random</SelectItem>
                            <SelectItem value="block">Block Random</SelectItem>
                            <SelectItem value="latin-square">Latin Square</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loop' && (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Loop & Merge Configuration</h3>
              
              <Card className="p-6">
                <p className="text-gray-500 text-center py-8">
                  Loop & Merge allows you to repeat a set of questions for different items or scenarios.
                  Configure loops based on lists, rosters, or participant responses.
                </p>
                
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Loop & Merge
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Simulation Panel */}
        {showSimulation && simulationResults.length > 0 && (
          <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Simulation Results</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSimulation(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Selection Distribution</Label>
                  <Card className="p-3 mt-2">
                    {(() => {
                      const distribution = calculateDistribution(simulationResults);
                      const maxCount = Math.max(...Object.values(distribution));
                      
                      return (
                        <div className="space-y-2">
                          {Object.entries(distribution)
                            .sort(([, a], [, b]) => b - a)
                            .map(([questionId, count]) => {
                              const question = questions.find(q => q.id === questionId);
                              const percentage = (count / simulationResults.length) * 100;
                              
                              return (
                                <div key={questionId} className="flex items-center gap-2">
                                  <div className="flex-1 text-xs truncate">
                                    {question?.title || questionId}
                                  </div>
                                  <div className="w-20">
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="h-2 bg-blue-500 rounded"
                                        style={{ width: `${(count / maxCount) * 100}%` }}
                                      />
                                      <span className="text-xs text-gray-500">
                                        {percentage.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })()}
                  </Card>
                </div>
                
                <div>
                  <Label className="text-sm">Sample Selections</Label>
                  <div className="space-y-2 mt-2">
                    {simulationResults.slice(0, 5).map((result, index) => (
                      <Card key={index} className="p-2">
                        <div className="flex items-center gap-2 mb-1">
                          {React.createElement(diceIcons[index % 6] || Dice1, {
                            className: 'w-4 h-4 text-gray-400',
                          })}
                          <span className="text-xs font-medium">Run {result.iteration}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.selected.map((qId: string) => {
                            const q = questions.find(qu => qu.id === qId);
                            return q?.title || qId;
                          }).join(', ')}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPoolManager;