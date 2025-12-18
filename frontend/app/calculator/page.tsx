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

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Calculator className="w-5 h-5 text-santander-red" />
          <h2 className="text-lg font-semibold text-gray-900">Calculadoras Regulatorias Avanzadas</h2>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'bg-santander-red text-white'
                  : 'bg-white text-gray-700 hover: bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* SECURITIZATION TAB */}
        {activeTab === 'securitization' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros del Tramo</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KIRB (%)</label>
                    <input type="number" value={kirb} onChange={(e) => setKirb(e.target.value)} step="0.1" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LGD (%)</label>
                    <input type="number" value={lgd} onChange={(e) => setLgd(e.target.value)} step="1" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maturity (años)</label>
                    <input type="number" value={maturity} onChange={(e) => setMaturity(e.target.value)} step="0.5" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pool Size (EUR M)</label>
                    <input type="number" value={poolSize} onChange={(e) => setPoolSize(e.target.value)} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (%)</label>
                    <input type="number" value={attachment} onChange={(e) => setAttachment(e.target.value)} step="0.5" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detachment (%)</label>
                    <input type="number" value={detachment} onChange={(e) => setDetachment(e.target.value)} step="0.5" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enfoque</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input type="radio" checked={approach === 'SEC-IRBA'} onChange={() => setApproach('SEC-IRBA')} className="mr-2" />
                      SEC-IRBA
                    </label>
                    <label className="flex items-center">
                      <input type="radio" checked={approach === 'SEC-SA'} onChange={() => setApproach('SEC-SA')} className="mr-2" />
                      SEC-SA
                    </label>
                  </div>
                </div>
                <label className="flex items-center">
                  <input type="checkbox" checked={isSts} onChange={(e) => setIsSts(e.target.checked)} className="mr-2" />
                  <span className="text-sm text-gray-700">Titulización STS (floor 10%)</span>
                </label>
                <div className="flex space-x-3 pt-4">
                  <button onClick={calculateSecuritization} disabled={isLoading} className="btn-primary flex-1">
                    {isLoading ?  'Calculando...' : 'Calcular RW'}
                  </button>
                  <button onClick={compareApproaches} disabled={isLoading} className="btn-secondary flex-1">
                    Comparar
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {result && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado - {result.approach}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">P-Parameter</p>
                      <p className="text-2xl font-bold text-santander-red">{result.p_parameter. toFixed(4)}</p>
                    </div>
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">Risk Weight</p>
                      <p className="text-2xl font-bold text-santander-red">{result.risk_weight_percent}</p>
                    </div>
                  </div>
                  {result.rwa && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">RWA</p>
                        <p className="text-lg font-semibold">€{result.rwa.toLocaleString()}M</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Capital (8%)</p>
                        <p className="text-lg font-semibold">€{result. capital_requirement?. toLocaleString()}M</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {comparison && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativa</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${comparison.optimal_approach === 'SEC-IRBA' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <span className="font-semibold">SEC-IRBA</span>
                      <p className="text-2xl font-bold">{comparison.sec_irba. risk_weight_percent}</p>
                    </div>
                    <div className={`p-4 rounded-lg border-2 ${comparison.optimal_approach === 'SEC-SA' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <span className="font-semibold">SEC-SA</span>
                      <p className="text-2xl font-bold">{comparison.sec_sa.risk_weight_percent}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-santander-red/10 rounded-lg">
                    <p className="text-gray-700">{comparison.recommendation}</p>
                  </div>
                </div>
              )}
              {!result && !comparison && (
                <div className="card text-center py-12">
                  <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los parámetros y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEVERAGE RATIO TAB */}
        {activeTab === 'leverage' && (
          <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Parámetros</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier 1 Capital (EUR M)</label>
                  <input type="number" value={tier1Capital} onChange={(e) => setTier1Capital(e.target. value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">On-Balance Exposures (EUR M)</label>
                  <input type="number" value={onBalanceExposures} onChange={(e) => setOnBalanceExposures(e.target. value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Derivative Exposures (EUR M)</label>
                  <input type="number" value={derivativeExposures} onChange={(e) => setDerivativeExposures(e.target. value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SFT Exposures (EUR M)</label>
                  <input type="number" value={sftExposures} onChange={(e) => setSftExposures(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Off-Balance Items (EUR M)</label>
                  <input type="number" value={offBalanceItems} onChange={(e) => setOffBalanceItems(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CCF Off-Balance (%)</label>
                  <input type="range" min="10" max="100" value={ccfOffBalance} onChange={(e) => setCcfOffBalance(e.target.value)} className="w-full" />
                  <span className="text-sm text-gray-600">{ccfOffBalance}%</span>
                </div>
                <button onClick={calculateLeverageRatio} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Calculando...' : 'Calcular Leverage Ratio'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {leverageResult && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado</h3>
                  <div className="mb-6">
                    <ProgressGauge value={leverageResult. leverage_ratio} min={0} max={0.10} threshold={0.03} label="Leverage Ratio" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">Leverage Ratio</p>
                      <p className="text-2xl font-bold text-santander-red">{leverageResult.leverage_ratio_percent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Exposure</p>
                      <p className="text-lg font-semibold">€{leverageResult.total_exposure_measure. toLocaleString()}M</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <ComplianceBadge compliant={leverageResult.compliant} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Breakdown:</p>
                    {Object.entries(leverageResult.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">€{value.toLocaleString()}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!leverageResult && (
                <div className="card text-center py-12">
                  <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los parámetros y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LCR TAB */}
        {activeTab === 'lcr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HQLA & Flujos</h3>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">HQLA</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Level 1 (EUR M)</label>
                      <input type="number" value={hqlaL1} onChange={(e) => setHqlaL1(e. target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Level 2A (EUR M)</label>
                      <input type="number" value={hqlaL2a} onChange={(e) => setHqlaL2a(e. target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Level 2B (EUR M)</label>
                      <input type="number" value={hqlaL2b} onChange={(e) => setHqlaL2b(e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
                <div className="border-b pb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Outflows</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Retail Stable (EUR M)</label>
                      <input type="number" value={retailStable} onChange={(e) => setRetailStable(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Retail Less Stable (EUR M)</label>
                      <input type="number" value={retailLessStable} onChange={(e) => setRetailLessStable(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Wholesale Operational (EUR M)</label>
                      <input type="number" value={wholesaleOp} onChange={(e) => setWholesaleOp(e. target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Wholesale Non-Op (EUR M)</label>
                      <input type="number" value={wholesaleNonOp} onChange={(e) => setWholesaleNonOp(e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Inflows</p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total Inflows (EUR M)</label>
                    <input type="number" value={inflows} onChange={(e) => setInflows(e.target.value)} className="input-field" />
                  </div>
                </div>
                <button onClick={calculateLCR} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Calculando...' : 'Calcular LCR'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {lcrResult && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado LCR</h3>
                  <div className="mb-6">
                    <ProgressGauge value={lcrResult. lcr} min={0} max={2} threshold={1} label="LCR" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">LCR</p>
                      <p className="text-2xl font-bold text-santander-red">{lcrResult.lcr_percent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">HQLA Adjusted</p>
                      <p className="text-lg font-semibold">€{lcrResult.hqla_adjusted.toLocaleString()}M</p>
                    </div>
                  </div>
                  <ComplianceBadge compliant={lcrResult.compliant} />
                  {Object.keys(lcrResult.caps_applied).length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Caps Aplicados:</p>
                      {Object.values(lcrResult.caps_applied).map((cap, idx) => (
                        <p key={idx} className="text-xs text-yellow-700">{cap}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!lcrResult && (
                <div className="card text-center py-12">
                  <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los parámetros y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NSFR TAB */}
        {activeTab === 'nsfr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ASF & RSF</h3>
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Available Stable Funding</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Capital & Long-term (EUR M)</label>
                      <input type="number" value={capitalLongTerm} onChange={(e) => setCapitalLongTerm(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Stable Retail Deposits (EUR M)</label>
                      <input type="number" value={stableRetailDep} onChange={(e) => setStableRetailDep(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Less Stable Deposits (EUR M)</label>
                      <input type="number" value={lessStableDep} onChange={(e) => setLessStableDep(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Wholesale Short-term (EUR M)</label>
                      <input type="number" value={wholesaleShort} onChange={(e) => setWholesaleShort(e. target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Required Stable Funding</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cash & Reserves (EUR M)</label>
                      <input type="number" value={cashReserves} onChange={(e) => setCashReserves(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Corporate Loans (EUR M)</label>
                      <input type="number" value={corporateLoans} onChange={(e) => setCorporateLoans(e. target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Mortgages (EUR M)</label>
                      <input type="number" value={mortgages} onChange={(e) => setMortgages(e. target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Other Loans (EUR M)</label>
                      <input type="number" value={otherLoans} onChange={(e) => setOtherLoans(e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
                <button onClick={calculateNSFR} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Calculando...' : 'Calcular NSFR'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {nsfrResult && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado NSFR</h3>
                  <div className="mb-6">
                    <ProgressGauge value={nsfrResult.nsfr} min={0} max={1.5} threshold={1} label="NSFR" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">NSFR</p>
                      <p className="text-2xl font-bold text-santander-red">{nsfrResult.nsfr_percent}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">ASF / RSF</p>
                      <p className="text-sm font-semibold">€{nsfrResult.total_asf. toLocaleString()}M / €{nsfrResult.total_rsf.toLocaleString()}M</p>
                    </div>
                  </div>
                  <ComplianceBadge compliant={nsfrResult.compliant} />
                </div>
              )}
              {!nsfrResult && (
                <div className="card text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los parámetros y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MREL TAB */}
        {activeTab === 'mrel' && (
          <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MREL Instruments</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CET1 Capital (EUR M)</label>
                  <input type="number" value={cet1} onChange={(e) => setCet1(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AT1 Capital (EUR M)</label>
                  <input type="number" value={at1} onChange={(e) => setAt1(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier 2 Capital (EUR M)</label>
                  <input type="number" value={tier2} onChange={(e) => setTier2(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senior Non-Preferred (EUR M)</label>
                  <input type="number" value={seniorNonPref} onChange={(e) => setSeniorNonPref(e.target.value)} className="input-field" />
                </div>
                <div className="border-t pt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total RWA (EUR M)</label>
                    <input type="number" value={totalRwa} onChange={(e) => setTotalRwa(e.target.value)} className="input-field" />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leverage Exposure (EUR M)</label>
                    <input type="number" value={leverageExposure} onChange={(e) => setLeverageExposure(e.target. value)} className="input-field" />
                  </div>
                </div>
                <button onClick={calculateMREL} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ?  'Calculando...' :  'Calcular MREL'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {mrelResult && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado MREL</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-santander-red/10 rounded-lg">
                      <p className="text-sm text-gray-600">Total MREL</p>
                      <p className="text-2xl font-bold text-santander-red">€{mrelResult.total_mrel.toLocaleString()}M</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">MREL / RWA</p>
                        <p className="text-lg font-semibold">{mrelResult.mrel_ratio_rwa_percent}</p>
                        <ComplianceBadge compliant={mrelResult.compliant_rwa} label="" />
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">MREL / LEM</p>
                        <p className="text-lg font-semibold">{mrelResult. mrel_ratio_lem_percent}</p>
                        <ComplianceBadge compliant={mrelResult.compliant_lem} label="" />
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Subordination</p>
                      <p className="text-lg font-semibold">{mrelResult. subordination_ratio_percent}</p>
                      <ComplianceBadge compliant={mrelResult.compliant_subordination} label="" />
                    </div>
                    <div className="pt-3 border-t">
                      <ComplianceBadge compliant={mrelResult.overall_compliant} label={mrelResult.overall_compliant ?  'MREL Cumple' : 'MREL No Cumple'} />
                    </div>
                  </div>
                </div>
              )}
              {!mrelResult && (
                <div className="card text-center py-12">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los parámetros y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IRRBB TAB */}
        {activeTab === 'irrbb' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate-Sensitive Gaps</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier 1 Capital (EUR M)</label>
                  <input type="number" value={irrbbTier1} onChange={(e) => setIrrbbTier1(e.target.value)} className="input-field" />
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Gaps por Plazo (EUR M)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Overnight</label>
                      <input type="number" value={gaps.overnight} onChange={(e) => setGaps({...gaps, overnight: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">1M</label>
                      <input type="number" value={gaps.m1} onChange={(e) => setGaps({...gaps, m1: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">3M</label>
                      <input type="number" value={gaps.m3} onChange={(e) => setGaps({...gaps, m3: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">6M</label>
                      <input type="number" value={gaps.m6} onChange={(e) => setGaps({...gaps, m6: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">1Y</label>
                      <input type="number" value={gaps.y1} onChange={(e) => setGaps({...gaps, y1: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">2Y</label>
                      <input type="number" value={gaps.y2} onChange={(e) => setGaps({...gaps, y2: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">3Y</label>
                      <input type="number" value={gaps.y3} onChange={(e) => setGaps({...gaps, y3: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">5Y</label>
                      <input type="number" value={gaps.y5} onChange={(e) => setGaps({...gaps, y5: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">7Y</label>
                      <input type="number" value={gaps.y7} onChange={(e) => setGaps({...gaps, y7: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">10Y</label>
                      <input type="number" value={gaps.y10} onChange={(e) => setGaps({...gaps, y10: e.target. value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">15Y</label>
                      <input type="number" value={gaps.y15} onChange={(e) => setGaps({...gaps, y15: e.target. value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">20Y+</label>
                      <input type="number" value={gaps. y20} onChange={(e) => setGaps({...gaps, y20: e.target.value})} className="input-field text-sm" />
                    </div>
                  </div>
                </div>
                <button onClick={calculateIRRBB} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ?  'Calculando...' :  'Calcular IRRBB'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {irrbbResult && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Escenarios IRRBB</h3>
                  <div className="mb-4 p-4 bg-santander-red/10 rounded-lg">
                    <p className="text-sm text-gray-600">Peor Escenario</p>
                    <p className="text-xl font-bold text-santander-red">{irrbbResult.worst_scenario}</p>
                    <p className="text-lg font-semibold">ΔEVEv:  €{irrbbResult.worst_delta_eve.toLocaleString()}M ({irrbbResult.worst_delta_eve_percent})</p>
                  </div>
                  <ComplianceBadge compliant={irrbbResult.overall_compliant} />
                  <div className="mt-4 space-y-2">
                    {irrbbResult.scenarios.map((scenario, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${scenario.breaches_threshold ?  'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{scenario.scenario_name}</span>
                          <span className={`text-sm font-semibold ${scenario.breaches_threshold ? 'text-red-600' : 'text-gray-700'}`}>
                            {scenario.delta_eve_percent_tier1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!irrbbResult && (
                <div className="card text-center py-12">
                  <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Introduce los gaps y calcula</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
