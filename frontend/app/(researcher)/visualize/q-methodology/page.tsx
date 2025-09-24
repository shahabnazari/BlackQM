'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FactorLoadingChart,
  QSortDistribution,
  DistinguishingStatements,
  ConsensusStatements,
} from '@/components/visualizations/q-methodology';
import { generateSampleQMethodologyData } from '@/lib/visualization/sample-data';

export default function QMethodologyDemoPage() {
  const [show3D, setShow3D] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Generate sample data
  const sampleData = generateSampleQMethodologyData();
  
  const handleRefreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Q-Methodology Visualization Suite
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Interactive visualizations for Q-methodology analysis including factor loadings, 
            statement distributions, consensus analysis, and distinguishing statements.
          </p>
          
          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleRefreshData}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              🔄 Generate New Data
            </button>
            <button
              onClick={() => setShow3D(!show3D)}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-200 ${
                show3D 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎲 {show3D ? 'Disable' : 'Enable'} 3D View
            </button>
          </div>
        </motion.div>

        {/* Visualizations Grid */}
        <div className="space-y-16">
          {/* Factor Loading Chart */}
          <motion.section
            key={`factor-loading-${refreshKey}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Factor Loading Chart
              </h2>
              <p className="text-gray-600">
                3D factor space visualization showing participant loadings with bubble sizes representing loading strength.
                {show3D && ' Currently showing 3D perspective view.'}
              </p>
            </div>
            <div className="flex justify-center">
              <FactorLoadingChart
                data={sampleData.factorLoadings}
                factors={sampleData.factors}
                width={900}
                height={600}
                significanceThreshold={0.4}
                show3D={show3D}
              />
            </div>
          </motion.section>

          {/* Q-Sort Distribution */}
          <motion.section
            key={`qsort-dist-${refreshKey}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Q-Sort Distribution
              </h2>
              <p className="text-gray-600">
                Distribution chart showing the Q-sort bell curve with overlays comparing actual vs expected (quasi-normal) distributions.
              </p>
            </div>
            <div className="flex justify-center">
              <QSortDistribution
                data={sampleData.qSortDistribution}
                width={800}
                height={400}
                showExpected={true}
              />
            </div>
          </motion.section>

          {/* Two Column Layout for Distinguishing and Consensus */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            {/* Distinguishing Statements */}
            <motion.section
              key={`distinguishing-${refreshKey}`}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Distinguishing Statements
                </h2>
                <p className="text-gray-600">
                  Chart highlighting statements that significantly distinguish between factors (p &lt; 0.05).
                </p>
              </div>
              <DistinguishingStatements
                data={sampleData.distinguishingStatements}
                factors={sampleData.factors}
                width={600}
                height={700}
              />
            </motion.section>

            {/* Consensus Statements */}
            <motion.section
              key={`consensus-${refreshKey}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Consensus Statements
                </h2>
                <p className="text-gray-600">
                  Visualization showing statements with high agreement across all factors (low standard deviation).
                </p>
              </div>
              <ConsensusStatements
                data={sampleData.consensusStatements}
                width={600}
                height={700}
                threshold={0.5}
              />
            </motion.section>
          </div>

          {/* Technical Information */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Technical Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Apple Design</h3>
                  <p className="text-sm text-gray-600">
                    Glass morphism effects with Apple's design language
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Animations</h3>
                  <p className="text-sm text-gray-600">
                    Smooth Framer Motion transitions and interactions
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">ViSX Charts</h3>
                  <p className="text-sm text-gray-600">
                    Professional data visualization with ViSX
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Interactive</h3>
                  <p className="text-sm text-gray-600">
                    Tooltips, selections, and dynamic filtering
                  </p>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">Sample Data Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-semibold">{sampleData.factorLoadings.length}</span> participants
                  </div>
                  <div>
                    <span className="font-semibold">{sampleData.factors.length}</span> factors
                  </div>
                  <div>
                    <span className="font-semibold">{sampleData.distinguishingStatements.length}</span> distinguishing statements
                  </div>
                  <div>
                    <span className="font-semibold">{sampleData.consensusStatements.length}</span> consensus statements
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}