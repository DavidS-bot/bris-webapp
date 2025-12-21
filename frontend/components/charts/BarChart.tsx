'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartDataPoint, SANTANDER_COLORS } from './ChartRenderer'

interface BRISBarChartProps {
  data: ChartDataPoint[]
  title?: string
  xAxis?: string
  yAxis?: string
  colors?: string[]
  showGrid?: boolean
  stacked?: boolean
  dataKeys?: string[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: <span className="font-medium">{entry.value.toLocaleString('es-ES')}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function BRISBarChart({
  data,
  title,
  xAxis,
  yAxis,
  colors = SANTANDER_COLORS,
  showGrid = true,
  stacked = false,
  dataKeys,
}: BRISBarChartProps) {
  // Detect data keys (columns) from data if not provided
  const keys = dataKeys || Object.keys(data[0] || {}).filter(k => k !== 'name' && typeof data[0][k] === 'number')

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey="name"
            tick={{ fill: '#374151', fontSize: 12 }}
            tickLine={{ stroke: '#9CA3AF' }}
            axisLine={{ stroke: '#9CA3AF' }}
            angle={-45}
            textAnchor="end"
            height={60}
            label={xAxis ? { value: xAxis, position: 'bottom', offset: 40, fill: '#6B7280' } : undefined}
          />
          <YAxis
            tick={{ fill: '#374151', fontSize: 12 }}
            tickLine={{ stroke: '#9CA3AF' }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickFormatter={(value) => value.toLocaleString('es-ES')}
            label={yAxis ? { value: yAxis, angle: -90, position: 'insideLeft', fill: '#6B7280' } : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          {keys.length > 1 && <Legend />}
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key === 'value' ? 'value' : key}
              name={key === 'value' ? 'Valor' : key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            >
              {keys.length === 1 && data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
