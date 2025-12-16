'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Filter, Database, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DocumentStats {
  total_chunks: number
  total_documents: number
  topics: Record<string, number>
  authorities: Record<string, number>
}

interface SearchResult {
  title: string
  file_name?: string
  regulatory_topic?: string
  excerpt: string
  relevance_score?: number
}

export default function DocumentsPage() {
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/documents/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/documents/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          top_k: 10,
          topic_filter: selectedTopic,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const topicLabels: Record<string, string> = {
    risk_management: 'Gestión de Riesgos',
    resolution: 'Resolución y Recuperación',
    capital_requirements: 'Requerimientos de Capital',
    conduct: 'Conducta',
    governance: 'Gobernanza',
    reporting: 'Reporting',
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-santander-red" />
          <h2 className="text-lg font-semibold text-gray-900">Base de Documentos</h2>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-santander-red" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-santander-red/10 rounded-lg">
                    <Database className="w-5 h-5 text-santander-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chunks Indexados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_chunks.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-santander-red/10 rounded-lg">
                    <FileText className="w-5 h-5 text-santander-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Documentos PDF</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_documents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-santander-red/10 rounded-lg">
                    <Filter className="w-5 h-5 text-santander-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Temas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.keys(stats.topics).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-santander-red/10 rounded-lg">
                    <Search className="w-5 h-5 text-santander-red" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Autoridad</p>
                    <p className="text-2xl font-bold text-gray-900">EBA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics Distribution */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución por Tema
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.topics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([topic, count]) => {
                    const percentage = (count / stats.total_chunks) * 100
                    return (
                      <div key={topic}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">
                            {topicLabels[topic] || topic}
                          </span>
                          <span className="text-gray-500">
                            {count.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-santander-red h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Error al cargar estadísticas
          </div>
        )}

        {/* Search Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Buscar en Documentos
          </h3>

          <div className="flex space-x-3 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar en la base de regulaciones..."
                className="input-field"
              />
            </div>
            <select
              value={selectedTopic || ''}
              onChange={(e) => setSelectedTopic(e.target.value || null)}
              className="input-field w-48"
            >
              <option value="">Todos los temas</option>
              {stats &&
                Object.keys(stats.topics).map((topic) => (
                  <option key={topic} value={topic}>
                    {topicLabels[topic] || topic}
                  </option>
                ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-primary"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4 mt-6">
              <p className="text-sm text-gray-500">
                {searchResults.length} resultados encontrados
              </p>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{result.title}</h4>
                    {result.relevance_score && (
                      <span className="text-xs px-2 py-1 bg-santander-red/10 text-santander-red rounded">
                        {(result.relevance_score * 100).toFixed(0)}% relevancia
                      </span>
                    )}
                  </div>
                  {result.regulatory_topic && (
                    <span className="inline-block text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded mb-2">
                      {topicLabels[result.regulatory_topic] || result.regulatory_topic}
                    </span>
                  )}
                  <p className="text-sm text-gray-600">{result.excerpt}</p>
                  {result.file_name && (
                    <p className="text-xs text-gray-400 mt-2">
                      📄 {result.file_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
