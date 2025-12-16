'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, Scale, ArrowRight, CheckCircle, XCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SecuritizationResult {
  approach: string
  p_parameter: number
  risk_weight: number
  risk_weight_percent: string
  rwa?: number
  capital_requirement?: number
  calculation_steps: string[]
}

interface ComparisonResult {
  sec_irba: SecuritizationResult
  sec_sa: SecuritizationResult
  optimal_approach: string
  rw_difference: number
  capital_savings?: number
  recommendation: string
}

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<'securitization' | 'leverage'>('securitization')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SecuritizationResult | null>(null)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)

  // Securitization inputs
  const [kirb, setKirb] = useState('4.0')
  const [lgd, setLgd] = useState('40')
  const [maturity, setMaturity] = useState('4')
  const [attachment, setAttachment] = useState('5')
  const [detachment, setDetachment] = useState('15')
  const [poolSize, setPoolSize] = useState('1000')
  const [approach, setApproach] = useState<'SEC-IRBA' | 'SEC-SA'>('SEC-IRBA')
  const [isSts, setIsSts] = useState(false)

  const calculateSecuritization = async () => {
    setIsLoading(true)
    setResult(null)
    setComparison(null)

    try {
      const response = await fetch(`${API_URL}/api/v1/calculator/securitization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kirb: parseFloat(kirb) / 100,
          lgd: parseFloat(lgd) / 100,
          maturity: parseFloat(maturity),
          attachment: parseFloat(attachment) / 100,
          detachment: parseFloat(detachment) / 100,
          pool_size: parseFloat(poolSize),
          approach: approach,
          is_sts: isSts,
        }),
      })

      if (!response.ok) throw new Error('Error en el cálculo')

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const compareApproaches = async () => {
    setIsLoading(true)
    setResult(null)
    setComparison(null)

    try {
      const response = await fetch(`${API_URL}/api/v1/calculator/securitization/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kirb: parseFloat(kirb) / 100,
          lgd: parseFloat(lgd) / 100,
          maturity: parseFloat(maturity),
          attachment: parseFloat(attachment) / 100,
          detachment: parseFloat(detachment) / 100,
          pool_size: parseFloat(poolSize),
          is_sts: isSts,
        }),
      })

      if (!response.ok) throw new Error('Error en la comparación')

      const data = await response.json()
      setComparison(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Calculator className="w-5 h-5 text-santander-red" />
          <h2 className="text-lg font-semibold text-gray-900">Calculadoras Regulatorias</h2>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('securitization')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'securitization'
                ? 'bg-santander-red text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Securitización
          </button>
          <button
            onClick={() => setActiveTab('leverage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leverage'
                ? 'bg-santander-red text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Scale className="w-4 h-4 inline mr-2" />
            Leverage Ratio
          </button>
        </div>

        {activeTab === 'securitization' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Parámetros del Tramo
              </h3>

              <div className="space-y-4">
                {/* Pool Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      KIRB (%)
                    </label>
                    <input
                      type="number"
                      value={kirb}
                      onChange={(e) => setKirb(e.target.value)}
                      step="0.1"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LGD (%)
                    </label>
                    <input
                      type="number"
                      value={lgd}
                      onChange={(e) => setLgd(e.target.value)}
                      step="1"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maturity (años)
                    </label>
                    <input
                      type="number"
                      value={maturity}
                      onChange={(e) => setMaturity(e.target.value)}
                      step="0.5"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pool Size (EUR M)
                    </label>
                    <input
                      type="number"
                      value={poolSize}
                      onChange={(e) => setPoolSize(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Tranche Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachment (%)
                    </label>
                    <input
                      type="number"
                      value={attachment}
                      onChange={(e) => setAttachment(e.target.value)}
                      step="0.5"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detachment (%)
                    </label>
                    <input
                      type="number"
                      value={detachment}
                      onChange={(e) => setDetachment(e.target.value)}
                      step="0.5"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Approach Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enfoque
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={approach === 'SEC-IRBA'}
                        onChange={() => setApproach('SEC-IRBA')}
                        className="mr-2 text-santander-red"
                      />
                      SEC-IRBA
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={approach === 'SEC-SA'}
                        onChange={() => setApproach('SEC-SA')}
                        className="mr-2 text-santander-red"
                      />
                      SEC-SA
                    </label>
                  </div>
                </div>

                {/* STS Toggle */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSts}
                    onChange={(e) => setIsSts(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Titulización STS (floor 10%)</span>
                </label>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={calculateSecuritization}
                    disabled={isLoading}
                    className="btn-primary flex-1"
                  >
                    {isLoading ? 'Calculando...' : 'Calcular RW'}
                  </button>
                  <button
                    onClick={compareApproaches}
                    disabled={isLoading}
                    className="btn-secondary flex-1"
                  >
                    Comparar Enfoques
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              {/* Single Result */}
              {result && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resultado - {result.approach}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">P-Parameter</p>
                      <p className="text-2xl font-bold text-santander-red">
                        {result.p_parameter.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Weight</p>
                      <p className="text-2xl font-bold text-santander-red">
                        {result.risk_weight_percent}
                      </p>
                    </div>
                  </div>

                  {result.rwa && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">RWA</p>
                        <p className="text-lg font-semibold">
                          €{result.rwa.toLocaleString()}M
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Capital (8%)</p>
                        <p className="text-lg font-semibold">
                          €{result.capital_requirement?.toLocaleString()}M
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Pasos del cálculo:</p>
                    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg font-mono">
                      {result.calculation_steps.map((step, idx) => (
                        <p key={idx}>{step}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Result */}
              {comparison && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Comparativa SEC-IRBA vs SEC-SA
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* SEC-IRBA */}
                    <div className={`p-4 rounded-lg border-2 ${
                      comparison.optimal_approach === 'SEC-IRBA'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">SEC-IRBA</span>
                        {comparison.optimal_approach === 'SEC-IRBA' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">p = {comparison.sec_irba.p_parameter.toFixed(4)}</p>
                      <p className="text-2xl font-bold">{comparison.sec_irba.risk_weight_percent}</p>
                      {comparison.sec_irba.capital_requirement && (
                        <p className="text-sm text-gray-600">
                          Capital: €{comparison.sec_irba.capital_requirement.toLocaleString()}M
                        </p>
                      )}
                    </div>

                    {/* SEC-SA */}
                    <div className={`p-4 rounded-lg border-2 ${
                      comparison.optimal_approach === 'SEC-SA'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">SEC-SA</span>
                        {comparison.optimal_approach === 'SEC-SA' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">p = 0.5 (fijo)</p>
                      <p className="text-2xl font-bold">{comparison.sec_sa.risk_weight_percent}</p>
                      {comparison.sec_sa.capital_requirement && (
                        <p className="text-sm text-gray-600">
                          Capital: €{comparison.sec_sa.capital_requirement.toLocaleString()}M
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 bg-santander-red/10 rounded-lg">
                    <p className="text-sm font-medium text-santander-red mb-1">
                      Recomendación
                    </p>
                    <p className="text-gray-700">{comparison.recommendation}</p>
                    {comparison.capital_savings && (
                      <p className="text-sm font-semibold mt-2">
                        Ahorro potencial: €{comparison.capital_savings.toLocaleString()}M
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!result && !comparison && (
                <div className="card text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Introduce los parámetros y pulsa calcular para ver los resultados
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'leverage' && (
          <div className="card text-center py-12">
            <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Calculadora de Leverage Ratio - Próximamente
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
