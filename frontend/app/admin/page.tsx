'use client'

import { useState, useEffect } from 'react'
import {
  RefreshCw,
  Download,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Play,
  ExternalLink
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Source {
  id: string
  name: string
  url: string
  document_types: string[]
  status: string
  scraping_enabled?: boolean
  last_scraped?: string
}

interface IndexedStats {
  total_chunks: number
  total_documents: number
  by_authority: Record<string, number>
  by_topic: Record<string, number>
}

interface ScrapeResult {
  source: string
  status: string
  documents_found: number
  documents_downloaded: number
  documents_indexed: number
  errors: string[]
}

interface DiscoveredDoc {
  title: string
  url: string
  type: string
  date?: string
  reference?: string
}

export default function AdminPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [stats, setStats] = useState<IndexedStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scrapingSource, setScrapingSource] = useState<string | null>(null)
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [discoveredDocs, setDiscoveredDocs] = useState<DiscoveredDoc[]>([])
  const [discoveringSource, setDiscoveringSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProductionMode, setIsProductionMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch sources
      const sourcesRes = await fetch(`${API_URL}/api/v1/admin/sources`)
      if (sourcesRes.ok) {
        const data = await sourcesRes.json()
        setSources(data.sources)
        // Check if any source indicates production mode
        if (data.sources.length > 0 && data.sources[0].scraping_enabled === false) {
          setIsProductionMode(true)
        }
      }

      // Fetch indexed stats
      const statsRes = await fetch(`${API_URL}/api/v1/admin/indexed-stats`)
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (err) {
      setError('Error al cargar datos. El backend puede no estar disponible.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const discoverDocuments = async (sourceId: string) => {
    setDiscoveringSource(sourceId)
    setDiscoveredDocs([])
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/sources/${sourceId}/discover`)
      if (res.ok) {
        const data = await res.json()
        setDiscoveredDocs(data.documents || [])
      } else {
        setError('Error al descubrir documentos')
      }
    } catch (err) {
      setError('Error de conexion')
    } finally {
      setDiscoveringSource(null)
    }
  }

  const startScraping = async (sourceId: string) => {
    setScrapingSource(sourceId)
    setScrapeResult(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/sources/${sourceId}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          index_immediately: true
        })
      })

      if (res.ok) {
        const data = await res.json()
        setScrapeResult(data)
        // Reload stats
        loadData()
      } else {
        setError('Error al iniciar scraping')
      }
    } catch (err) {
      setError('Error de conexion')
    } finally {
      setScrapingSource(null)
    }
  }

  const startBackgroundScraping = async (sourceId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/scrape/background/${sourceId}`, {
        method: 'POST'
      })
      if (res.ok) {
        alert(`Scraping iniciado en segundo plano para ${sourceId}`)
      }
    } catch (err) {
      setError('Error al iniciar scraping')
    }
  }

  const triggerReindex = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/reindex`, {
        method: 'POST'
      })
      if (res.ok) {
        alert('Reindexacion iniciada en segundo plano')
      }
    } catch (err) {
      setError('Error al iniciar reindexacion')
    }
  }

  const authorityLabels: Record<string, string> = {
    EBA: 'European Banking Authority',
    ECB: 'European Central Bank',
    ESMA: 'European Securities and Markets Authority',
    SRB: 'Single Resolution Board',
    BIS: 'Bank for International Settlements',
    FSB: 'Financial Stability Board'
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-santander-red" />
            <h2 className="text-lg font-semibold text-gray-900">
              Administracion RAG
            </h2>
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-santander-red"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona la actualizacion automatica de documentos regulatorios
        </p>
      </div>

      {/* Production Mode Banner */}
      {isProductionMode && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Modo Produccion</p>
              <p className="text-sm text-amber-700 mt-1">
                El scraping automatico no esta disponible en el servidor desplegado.
                Para actualizar el RAG con nuevos documentos:
              </p>
              <ol className="text-sm text-amber-700 mt-2 list-decimal ml-4 space-y-1">
                <li>Ejecuta localmente: <code className="bg-amber-100 px-1 rounded">python -m src.scrapers.cli --source eba</code></li>
                <li>Indexa: <code className="bg-amber-100 px-1 rounded">python -m src.indexer.index_documents</code></li>
                <li>Comprime: <code className="bg-amber-100 px-1 rounded">tar -czf vectordb.tar.gz vectordb/</code></li>
                <li>Sube a GitHub Releases y redeploy en Render</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-santander-red" />
          </div>
        ) : (
          <>
            {/* Current Stats */}
            {stats && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-santander-red" />
                  <span>Estado Actual del RAG</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Chunks</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_chunks.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_documents}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Autoridades</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.keys(stats.by_authority).length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Temas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.keys(stats.by_topic).length}
                    </p>
                  </div>
                </div>

                {Object.keys(stats.by_authority).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Por Autoridad:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.by_authority).map(([auth, count]) => (
                        <span
                          key={auth}
                          className="px-3 py-1 bg-santander-red/10 text-santander-red rounded-full text-sm"
                        >
                          {auth}: {count.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={triggerReindex}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-santander-red"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reindexar documentos locales</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sources */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Fuentes Regulatorias Disponibles
              </h3>

              <div className="space-y-4">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {source.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            source.status === 'local_only'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {source.status === 'local_only' ? 'Solo local' : source.status}
                          </span>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-santander-red hover:underline flex items-center space-x-1"
                        >
                          <span>{source.url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {source.document_types.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        {source.last_scraped && (
                          <p className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Ultimo scraping: {new Date(source.last_scraped).toLocaleString()}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => discoverDocuments(source.id)}
                          disabled={discoveringSource === source.id || isProductionMode}
                          className={`btn-secondary text-sm flex items-center space-x-1 ${isProductionMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isProductionMode ? 'No disponible en produccion' : 'Descubrir nuevos documentos'}
                        >
                          {discoveringSource === source.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>Descubrir</span>
                        </button>
                        <button
                          onClick={() => startScraping(source.id)}
                          disabled={scrapingSource === source.id || isProductionMode}
                          className={`btn-primary text-sm flex items-center space-x-1 ${isProductionMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isProductionMode ? 'No disponible en produccion' : 'Actualizar RAG'}
                        >
                          {scrapingSource === source.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span>Actualizar RAG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discovered Documents Preview */}
            {discoveredDocs.length > 0 && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Documentos Descubiertos ({discoveredDocs.length})</span>
                </h3>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {discoveredDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              {doc.type}
                            </span>
                            {doc.date && (
                              <span className="text-xs text-gray-400">
                                {doc.date}
                              </span>
                            )}
                            {doc.reference && (
                              <span className="text-xs text-gray-500">
                                {doc.reference}
                              </span>
                            )}
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-santander-red hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scrape Result */}
            {scrapeResult && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Resultado del Scraping</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Estado</p>
                    <p className="text-lg font-semibold text-green-600">
                      {scrapeResult.status}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Encontrados</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {scrapeResult.documents_found}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Descargados</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {scrapeResult.documents_downloaded}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Indexados</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {scrapeResult.documents_indexed}
                    </p>
                  </div>
                </div>

                {scrapeResult.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-700 mb-2">
                      Errores ({scrapeResult.errors.length}):
                    </p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {scrapeResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
