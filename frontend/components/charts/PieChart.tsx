'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartDataPoint, SANTANDER_COLORS } from './ChartRenderer'

interface BRISPieChartProps {
  data: ChartDataPoint[]
  title?: string
  colors?: string[]
  showLegend?: boolean
  isDonut?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    const total = data.payload.total || 0
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Valor: <span className="font-medium">{data.value.toLocaleString('es-ES')}</span>
        </p>
        <p className="text-sm text-gray-600">
          Porcentaje: <span className="font-medium">{percentage}%</span>
        </p>
      </div>
    )
  }
  return null
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show labels for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function BRISPieChart({
  data,
  title,
  colors = SANTANDER_COLORS,
  showLegend = true,
  isDonut = false,
}: BRISPieChartProps) {
  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithTotal = data.map(item => ({ ...item, total }))

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            innerRadius={isDonut ? 60 : 0}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {/* Summary below chart */}
      <div className="mt-2 text-center text-sm text-gray-500">
        Total: <span className="font-medium text-gray-900">{total.toLocaleString('es-ES')}</span>
      </div>
    </div>
  )
}
