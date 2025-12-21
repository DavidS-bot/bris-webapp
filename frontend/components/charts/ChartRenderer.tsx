'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid SSR issues with Recharts
const BRISBarChart = dynamic(() => import('./BarChart'), { ssr: false })
const BRISLineChart = dynamic(() => import('./LineChart'), { ssr: false })
const BRISPieChart = dynamic(() => import('./PieChart'), { ssr: false })
const BRISAreaChart = dynamic(() => import('./AreaChart'), { ssr: false })

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface ChartSpec {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'composed'
  title?: string
  data: ChartDataPoint[]
  xAxis?: string
  yAxis?: string
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  stacked?: boolean
  dataKeys?: string[]
}

// Santander color palette
export const SANTANDER_COLORS = [
  '#EC0000', // Primary red
  '#B40000', // Dark red
  '#1A1A1A', // Black
  '#767676', // Gray
  '#4A90A4', // Blue accent
  '#50C878', // Green accent
  '#FFB347', // Orange accent
  '#9B59B6', // Purple accent
]

interface ChartRendererProps {
  spec: ChartSpec
}

export function ChartRenderer({ spec }: ChartRendererProps) {
  const colors = spec.colors || SANTANDER_COLORS

  const renderChart = () => {
    switch (spec.type) {
      case 'bar':
        return (
          <BRISBarChart
            data={spec.data}
            title={spec.title}
            xAxis={spec.xAxis}
            yAxis={spec.yAxis}
            colors={colors}
            showGrid={spec.showGrid}
            stacked={spec.stacked}
            dataKeys={spec.dataKeys}
          />
        )
      case 'line':
        return (
          <BRISLineChart
            data={spec.data}
            title={spec.title}
            xAxis={spec.xAxis}
            yAxis={spec.yAxis}
            colors={colors}
            showGrid={spec.showGrid}
            dataKeys={spec.dataKeys}
          />
        )
      case 'pie':
      case 'donut':
        return (
          <BRISPieChart
            data={spec.data}
            title={spec.title}
            colors={colors}
            showLegend={spec.showLegend}
            isDonut={spec.type === 'donut'}
          />
        )
      case 'area':
        return (
          <BRISAreaChart
            data={spec.data}
            title={spec.title}
            xAxis={spec.xAxis}
            yAxis={spec.yAxis}
            colors={colors}
            showGrid={spec.showGrid}
            stacked={spec.stacked}
            dataKeys={spec.dataKeys}
          />
        )
      default:
        return <div className="text-gray-500">Tipo de gráfica no soportado: {spec.type}</div>
    }
  }

  return (
    <div className="chart-container my-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {renderChart()}
    </div>
  )
}

// Helper function to parse chart JSON from markdown code blocks
export function parseChartFromCode(code: string): ChartSpec | null {
  try {
    const spec = JSON.parse(code)
    if (spec && spec.type && spec.data && Array.isArray(spec.data)) {
      return spec as ChartSpec
    }
    return null
  } catch {
    return null
  }
}

export default ChartRenderer
