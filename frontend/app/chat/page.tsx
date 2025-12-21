'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2, Sparkles, FileText, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChartRenderer, parseChartFromCode } from '@/components/charts'
import {
  MarkdownTable,
  MarkdownThead,
  MarkdownTbody,
  MarkdownTr,
  MarkdownTh,
  MarkdownTd,
} from '@/components/tables'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  suggestions?: string[]
  timestamp: Date
}

interface Source {
  title: string
  file_name?: string
  regulatory_topic?: string
  excerpt: string
  relevance_score?: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const EXAMPLE_QUERIES = [
  '¿Cómo se calcula el p-parameter en SEC-IRBA?',
  '¿Cuáles son los requisitos de MREL?',
  '¿Qué CCF aplica a compromisos fuera de balance?',
  'Explica el tratamiento de garantías bajo CRR',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/v1/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          include_sources: true,
          language: 'es',
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const data = await response.json()

      setSessionId(data.session_id)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        suggestions: data.suggestions,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
    setSelectedSource(null)
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-santander-red" />
            <h2 className="text-lg font-semibold text-gray-900">Chat con BRIS</h2>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 text-sm text-gray-500 hover:text-santander-red transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Nueva conversación</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-santander-red/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-santander-red" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Bienvenido a BRIS!
              </h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Soy tu asistente experto en regulación bancaria europea.
                Puedo ayudarte con CRR/CRD, Basel III, securitización, MREL y más.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {EXAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(query)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-santander-red hover:bg-santander-red/5 transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={
                    message.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-assistant'
                  }
                >
                  {message.role === 'assistant' ? (
                    <div className="prose-chat">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom table components with Santander styling
                          table: ({ children }) => <MarkdownTable>{children}</MarkdownTable>,
                          thead: ({ children }) => <MarkdownThead>{children}</MarkdownThead>,
                          tbody: ({ children }) => <MarkdownTbody>{children}</MarkdownTbody>,
                          tr: ({ children }) => <MarkdownTr>{children}</MarkdownTr>,
                          th: ({ children, style }) => <MarkdownTh style={style}>{children}</MarkdownTh>,
                          td: ({ children, style }) => <MarkdownTd style={style}>{children}</MarkdownTd>,
                          // Custom code block handler for charts
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '')
                            const language = match ? match[1] : ''
                            const codeContent = String(children).replace(/\n$/, '')

                            // Check if this is a chart specification
                            if (language === 'chart') {
                              const chartSpec = parseChartFromCode(codeContent)
                              if (chartSpec) {
                                return <ChartRenderer spec={chartSpec} />
                              }
                            }

                            // Regular code block
                            if (language) {
                              return (
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-3">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              )
                            }

                            // Inline code
                            return (
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            )
                          },
                          // Better pre handling
                          pre: ({ children }) => <>{children}</>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            Fuentes ({message.sources.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.slice(0, 3).map((source, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedSource(source)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-santander-red/10 hover:text-santander-red transition-colors"
                              >
                                {source.title.slice(0, 30)}...
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendMessage(suggestion)}
                              className="text-xs px-3 py-1.5 bg-santander-red/10 text-santander-red rounded-full hover:bg-santander-red/20 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="chat-bubble-assistant">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-santander-red rounded-full thinking-dot"></div>
                    <div className="w-2 h-2 bg-santander-red rounded-full thinking-dot"></div>
                    <div className="w-2 h-2 bg-santander-red rounded-full thinking-dot"></div>
                  </div>
                  <span className="text-sm text-gray-500">Analizando regulación...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta sobre regulación bancaria..."
                rows={1}
                className="input-field resize-none"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="btn-primary flex items-center justify-center w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            BRIS puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>

      {/* Source Panel */}
      {selectedSource && (
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Fuente</h3>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">{selectedSource.title}</h4>
            {selectedSource.file_name && (
              <p className="text-xs text-gray-500 mb-2">
                📄 {selectedSource.file_name}
              </p>
            )}
            {selectedSource.regulatory_topic && (
              <span className="inline-block px-2 py-1 bg-santander-red/10 text-santander-red text-xs rounded mb-3">
                {selectedSource.regulatory_topic}
              </span>
            )}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
              {selectedSource.excerpt}
            </div>
            {selectedSource.relevance_score && (
              <p className="mt-2 text-xs text-gray-400">
                Relevancia: {(selectedSource.relevance_score * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
