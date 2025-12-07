'use client';

import { useEffect, useState } from 'react';

interface SourceResult {
  papers: number;
  duration: number;
  error?: string;
}

interface SearchMetadata {
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, SourceResult>;
    searchDuration: number;
  };
  stage2?: {
    startingPapers: number;
    afterEnrichment: number;
    afterRelevanceFilter: number;
    afterQualitySort: number;
    finalPapers: number;
  };
  totalCollected?: number;
  sourceBreakdown?: Record<string, SourceResult>;
  deduplicationRate?: number;
  duplicatesRemoved?: number;
}

interface SearchResults {
  papers: any[];
  total: number;
  metadata?: SearchMetadata;
}

export default function SearchStatsDebugPage() {
  const [searchData, setSearchData] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try multiple approaches to get search data
    let foundData = null;

    // Approach 1: Check all localStorage keys for search-related data
    const allKeys = Object.keys(localStorage);
    console.log('📊 All localStorage keys:', allKeys);

    // Look for specific Zustand store keys first
    const zustandStoreKeys = ['literature-search-store', 'references-store', 'theme-extraction-store'];

    for (const storeKey of zustandStoreKeys) {
      try {
        const storeData = localStorage.getItem(storeKey);
        if (storeData) {
          const parsed = JSON.parse(storeData);
          console.log(`📦 Zustand store ${storeKey}:`, parsed);

          // Zustand stores have a 'state' property
          const state = parsed.state || parsed;

          // Check for search results in the state
          if (state.searchResults || state.lastSearchResults || state.papers) {
            foundData = state.searchResults || state.lastSearchResults || state;
            console.log('✅ Found search data in Zustand store:', storeKey);
            break;
          }
        }
      } catch (e) {
        console.log(`⚠️ Failed to parse Zustand store ${storeKey}`);
      }
    }

    // Fallback: Look for any key containing 'search', 'literature', 'cache', or 'query'
    if (!foundData) {
      const searchKeys = allKeys.filter(key =>
        key.toLowerCase().includes('search') ||
        key.toLowerCase().includes('literature') ||
        key.toLowerCase().includes('cache') ||
        key.toLowerCase().includes('query')
      );
      console.log('🔍 Search-related keys:', searchKeys);

      // Try each key
      for (const key of searchKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          console.log(`📦 Data in ${key}:`, data);

          // Check if this looks like search results
          if (data && (data.metadata || data.papers || data.total !== undefined)) {
            foundData = data;
            console.log('✅ Found search data in key:', key);
            break;
          }
        } catch (e) {
          console.log(`⚠️ Failed to parse ${key}`);
        }
      }
    }

    // Approach 2: Check for common key patterns
    if (!foundData) {
      const commonPatterns = [
        'lastSearchResults',
        'searchResults',
        'literatureSearch',
        'recentSearch',
        'cachedSearch'
      ];

      for (const pattern of commonPatterns) {
        try {
          const data = localStorage.getItem(pattern);
          if (data) {
            foundData = JSON.parse(data);
            console.log('✅ Found data in pattern:', pattern);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }

    // Approach 3: Check sessionStorage
    if (!foundData) {
      try {
        const sessionKeys = Object.keys(sessionStorage);
        console.log('📊 SessionStorage keys:', sessionKeys);

        for (const key of sessionKeys) {
          const data = JSON.parse(sessionStorage.getItem(key) || '{}');
          if (data && (data.metadata || data.papers)) {
            foundData = data;
            console.log('✅ Found data in sessionStorage:', key);
            break;
          }
        }
      } catch (e) {
        console.log('⚠️ SessionStorage check failed');
      }
    }

    if (foundData) {
      setSearchData(foundData);
    } else {
      setError(
        'No search data found in browser storage. ' +
        'Check browser console for available keys. ' +
        'Perform a search on the Literature page, then return here.'
      );
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Loading Search Statistics...</h1>
        </div>
      </div>
    );
  }

  if (error || !searchData?.metadata) {
    // Get localStorage keys for debugging
    const allKeys = typeof window !== 'undefined' ? Object.keys(localStorage) : [];
    const sessionKeys = typeof window !== 'undefined' ? Object.keys(sessionStorage) : [];

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-yellow-400">🔍 Search Statistics Debug</h1>

          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold mb-2 text-yellow-300">⚠️ No Search Data Found</h2>
            <p className="text-gray-300 mb-4">{error || 'No metadata available in browser storage'}</p>

            <div className="bg-gray-900 rounded p-4 mb-4">
              <h3 className="font-bold text-blue-400 mb-2">📋 Debugging Information:</h3>
              <div className="space-y-2 text-sm font-mono">
                <div>
                  <span className="text-gray-400">localStorage keys ({allKeys.length}):</span>
                  <div className="text-gray-500 ml-4">
                    {allKeys.length > 0 ? allKeys.join(', ') : 'None'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">sessionStorage keys ({sessionKeys.length}):</span>
                  <div className="text-gray-500 ml-4">
                    {sessionKeys.length > 0 ? sessionKeys.join(', ') : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Show raw Zustand store content */}
            <div className="bg-gray-900 rounded p-4 mb-4">
              <h3 className="font-bold text-purple-400 mb-2">🔍 literature-search-store Content:</h3>
              <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                {typeof window !== 'undefined' && localStorage.getItem('literature-search-store')
                  ? JSON.stringify(JSON.parse(localStorage.getItem('literature-search-store') || '{}'), null, 2)
                  : 'Not found'}
              </pre>
            </div>

            <div className="bg-blue-900/20 border border-blue-500 rounded p-4">
              <h3 className="font-bold text-blue-300 mb-2">💡 How to see your search stats:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Open browser DevTools (F12 or Right-click → Inspect)</li>
                <li>Go to the <span className="text-blue-400 font-mono">Console</span> tab</li>
                <li>Look for the logs showing all localStorage keys</li>
                <li>OR: Check the <span className="text-blue-400 font-mono">Network</span> tab for the search API response</li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold mb-4 text-green-400">📊 Known Search Statistics (from backend logs)</h2>
            <p className="text-gray-400 mb-4">Latest search: "animal social behavior investigations"</p>

            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">📦 Total Collected:</span>
                <span className="text-white font-bold">2,789 papers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅ After Deduplication:</span>
                <span className="text-white font-bold">2,763 papers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🏆 Top Sources:</span>
                <span className="text-gray-300">PMC (600), PubMed (600), Crossref (400), ERIC (400)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">❌ Failed:</span>
                <span className="text-gray-300">Springer (0 papers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">⏱️ Duration:</span>
                <span className="text-gray-300">35.3 seconds</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <a href="/discover/literature" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              ← Go to Literature Search
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metadata = searchData.metadata;
  const sourceBreakdown = metadata.stage1?.sourceBreakdown || metadata.sourceBreakdown || {};

  // Calculate Stage 1 statistics
  const sourcesWithPapers = Object.entries(sourceBreakdown).filter(([_, data]) => data.papers > 0);
  const sourcesWithErrors = Object.entries(sourceBreakdown).filter(([_, data]) => data.error);
  const totalSources = Object.keys(sourceBreakdown).length;
  const totalPapersFromSources = sourcesWithPapers.reduce((sum, [_, data]) => sum + data.papers, 0);
  const avgPapersPerSource = sourcesWithPapers.length > 0
    ? (totalPapersFromSources / sourcesWithPapers.length).toFixed(1)
    : '0.0';
  const successRate = totalSources > 0
    ? ((sourcesWithPapers.length / totalSources) * 100).toFixed(1)
    : '0.0';

  // Sort sources by paper count
  const sortedSources = [...sourcesWithPapers].sort((a, b) => b[1].papers - a[1].papers);

  // Calculate Stage 2 statistics
  const totalCollected = metadata.totalCollected || metadata.stage1?.totalCollected || 0;
  const uniquePapers = metadata.stage2?.startingPapers || 0;
  const duplicatesRemoved = metadata.duplicatesRemoved || (totalCollected - uniquePapers);
  const deduplicationRate = metadata.deduplicationRate || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔍 Enterprise Search Statistics</h1>
          <p className="text-gray-400">Real-time debugging dashboard for search pipeline</p>
          <a href="/discover/literature" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Literature Search
          </a>
        </div>

        {/* Dashboard 1: Stage 1 Source Performance */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6 font-mono text-sm">
          <div className="border-b-2 border-gray-700 pb-2 mb-4">
            <h2 className="text-xl font-bold text-blue-400">📊 STAGE 1 COMPLETE - SOURCE PERFORMANCE</h2>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅ Successful Sources:</span>
              <span className="text-white font-bold">{sourcesWithPapers.length}/{totalSources}</span>
              <span className="text-gray-400">({successRate}% success rate)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">❌ Failed Sources:</span>
              <span className="text-white font-bold">{sourcesWithErrors.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📈 Average Papers/Source:</span>
              <span className="text-white font-bold">{avgPapersPerSource}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">📦 Total Papers Collected:</span>
              <span className="text-white font-bold">{totalCollected}</span>
            </div>
          </div>

          <div className="border-t-2 border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">🏆 Top 5 Sources by Paper Count:</h3>
            <div className="space-y-1">
              {sortedSources.slice(0, 5).map(([source, data], index) => (
                <div key={source} className="flex items-center gap-2 text-gray-300">
                  <span className="text-yellow-400 font-bold">{index + 1}.</span>
                  <span className="text-white">{source}:</span>
                  <span className="text-blue-400">{data.papers} papers</span>
                  <span className="text-gray-500">({(data.duration / 1000).toFixed(2)}s)</span>
                </div>
              ))}
            </div>
          </div>

          {sourcesWithErrors.length > 0 && (
            <div className="border-t-2 border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-red-400 mb-2">⚠️  Failed Sources ({sourcesWithErrors.length}):</h3>
              <div className="space-y-1">
                {sourcesWithErrors.map(([source, data]) => (
                  <div key={source} className="flex items-center gap-2 text-gray-300">
                    <span className="text-red-400">✗</span>
                    <span className="text-white">{source}:</span>
                    <span className="text-red-300">{data.error || 'Unknown error'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dashboard 2: Stage 2 Processing */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6 font-mono text-sm">
          <div className="border-b-2 border-gray-700 pb-2 mb-4">
            <h2 className="text-xl font-bold text-green-400">📊 STAGE 2 - PROCESSING PIPELINE</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">1️⃣  Initial Collection:</span>
              <span className="text-white font-bold">{totalCollected} papers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">2️⃣  After Deduplication:</span>
              <span className="text-white font-bold">{uniquePapers} papers</span>
              <span className="text-red-400">(-{duplicatesRemoved} duplicates, {(deduplicationRate * 100).toFixed(1)}% dup rate)</span>
            </div>
            {metadata.stage2 && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">3️⃣  After Enrichment:</span>
                  <span className="text-white font-bold">{metadata.stage2.afterEnrichment || 0} papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">4️⃣  After Relevance Filter:</span>
                  <span className="text-white font-bold">{metadata.stage2.afterRelevanceFilter || 0} papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">5️⃣  Final Papers:</span>
                  <span className="text-white font-bold">{metadata.stage2.finalPapers || 0} papers</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* All Sources Table */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 font-mono text-sm">
          <h2 className="text-xl font-bold text-purple-400 mb-4">📋 Complete Source Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-4 text-gray-400">#</th>
                  <th className="text-left py-2 px-4 text-gray-400">Source</th>
                  <th className="text-right py-2 px-4 text-gray-400">Papers</th>
                  <th className="text-right py-2 px-4 text-gray-400">Duration</th>
                  <th className="text-left py-2 px-4 text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sourceBreakdown)
                  .sort((a, b) => b[1].papers - a[1].papers)
                  .map(([source, data], index) => (
                    <tr key={source} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-2 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-2 px-4 text-white font-semibold">{source}</td>
                      <td className="py-2 px-4 text-right">
                        <span className={data.papers > 0 ? 'text-green-400' : 'text-red-400'}>
                          {data.papers}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right text-gray-400">
                        {(data.duration / 1000).toFixed(2)}s
                      </td>
                      <td className="py-2 px-4">
                        {data.error ? (
                          <span className="text-red-400">❌ {data.error}</span>
                        ) : data.papers > 0 ? (
                          <span className="text-green-400">✅ Success</span>
                        ) : (
                          <span className="text-yellow-400">⚠️  No results</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Metadata */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mt-6 font-mono text-xs">
          <h2 className="text-xl font-bold text-gray-400 mb-4">🔧 Raw Metadata (JSON)</h2>
          <pre className="overflow-x-auto text-gray-400 whitespace-pre-wrap">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🔄 Refresh the page after performing a new search to see updated stats</p>
          <p className="mt-2">
            <a href="/discover/literature" className="text-blue-400 hover:text-blue-300">
              Perform a new search →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
