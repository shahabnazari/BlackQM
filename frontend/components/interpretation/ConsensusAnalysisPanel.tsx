import React from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge';
import { 
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface ConsensusAnalysisPanelProps {
  analysisResults: any;
  factors: any[];
}

/**
 * ConsensusAnalysisPanel Component - Phase 8 Day 1
 * 
 * Analyzes and displays consensus statements across factors
 * Identifies common ground and shared perspectives
 */
export function ConsensusAnalysisPanel({
  analysisResults,
  factors
}: ConsensusAnalysisPanelProps) {
  // Extract consensus statements from analysis results
  const consensusStatements = analysisResults?.consensusStatements || [];
  
  // Calculate agreement levels
  const getAgreementLevel = (statement: any) => {
    const scores = statement.scores || [];
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    return Math.round(Math.abs(avg) * 100);
  };


  return (
    <Card className="p-6 bg-white">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-label flex items-center gap-2 mb-2">
          <CheckCircleIcon className="w-6 h-6 text-green-500" />
          Consensus Analysis
        </h2>
        <p className="text-sm text-secondary-label">
          Statements with high agreement across all factors represent shared perspectives
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-system-green/5 border border-system-green/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label mb-1">High Consensus</p>
              <p className="text-2xl font-semibold text-system-green">
                {consensusStatements.filter((s: any) => getAgreementLevel(s) >= 80).length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-system-green/20" />
          </div>
        </Card>
        
        <Card className="p-4 bg-system-blue/5 border border-system-blue/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label mb-1">Moderate Consensus</p>
              <p className="text-2xl font-semibold text-system-blue">
                {consensusStatements.filter((s: any) => {
                  const level = getAgreementLevel(s);
                  return level >= 60 && level < 80;
                }).length}
              </p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-system-blue/20" />
          </div>
        </Card>
        
        <Card className="p-4 bg-system-gray-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-label mb-1">Total Analyzed</p>
              <p className="text-2xl font-semibold text-label">
                {consensusStatements.length}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-system-gray-3" />
          </div>
        </Card>
      </div>

      {/* Consensus Statements List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-secondary-label">Consensus Statements</h3>
        
        {consensusStatements.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-system-gray-4 mb-4" />
            <p className="text-secondary-label">
              No consensus analysis available. Complete factor analysis first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consensusStatements
              .sort((a: any, b: any) => getAgreementLevel(b) - getAgreementLevel(a))
              .map((statement: any, index: number) => {
                const agreementLevel = getAgreementLevel(statement);
                
                return (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-system-gray-4 hover:border-system-gray-3 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-label flex-1">
                        {statement.text || statement.statement || 'No text available'}
                      </p>
                      <Badge 
                        variant={agreementLevel >= 80 ? 'success' : agreementLevel >= 60 ? 'info' : 'default'}
                        className="ml-3"
                      >
                        {agreementLevel}% agreement
                      </Badge>
                    </div>
                    
                    {/* Agreement Bar */}
                    <div className="mb-3">
                      <div className="w-full h-2 bg-system-gray-5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            agreementLevel >= 80 ? 'bg-system-green' :
                            agreementLevel >= 60 ? 'bg-system-blue' :
                            agreementLevel >= 40 ? 'bg-system-yellow' :
                            'bg-system-gray-3'
                          }`}
                          style={{ width: `${agreementLevel}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Factor Tags */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary-label">Appears in:</span>
                      <div className="flex gap-1">
                        {(statement.factors || factors.map((_: any, i: number) => i + 1))
                          .slice(0, 4)
                          .map((f: number) => (
                            <Badge key={f} variant="default" size="sm">
                              F{f}
                            </Badge>
                          ))}
                        {statement.factors && statement.factors.length > 4 && (
                          <Badge variant="default" size="sm">
                            +{statement.factors.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Interpretation */}
                    {statement.interpretation && (
                      <div className="mt-3 p-3 bg-system-gray-6 rounded">
                        <p className="text-xs text-secondary-label italic">
                          {statement.interpretation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Insights */}
      {consensusStatements.length > 0 && (
        <Card className="mt-6 p-4 bg-system-blue/5 border border-system-blue/20">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-system-blue" />
            Key Insights
          </h4>
          <ul className="text-xs text-secondary-label space-y-1">
            <li>
              • {consensusStatements.filter((s: any) => getAgreementLevel(s) >= 80).length} statements 
              show high consensus (≥80% agreement)
            </li>
            <li>
              • These represent shared viewpoints across different participant perspectives
            </li>
            <li>
              • Focus on high-consensus items when reporting common ground
            </li>
            <li>
              • Low-consensus items may indicate areas of disagreement worth exploring
            </li>
          </ul>
        </Card>
      )}
    </Card>
  );
}