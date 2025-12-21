'use client'

import React from 'react'

interface SantanderTableProps {
  children: React.ReactNode
}

interface TableHeaderProps {
  children: React.ReactNode
}

interface TableBodyProps {
  children: React.ReactNode
}

interface TableRowProps {
  children: React.ReactNode
  isHeader?: boolean
}

interface TableCellProps {
  children: React.ReactNode
  isHeader?: boolean
  align?: 'left' | 'center' | 'right'
}

// Helper to detect if content is a number and format it
function formatCellContent(content: React.ReactNode): React.ReactNode {
  if (typeof content === 'string') {
    // Check if it's a percentage change (e.g., "+5.2%", "-3.1%")
    const changeMatch = content.match(/^([+-])(\d+(?:[.,]\d+)?)\s*%?$/)
    if (changeMatch) {
      const isPositive = changeMatch[1] === '+'
      return (
        <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {content}
        </span>
      )
    }

    // Check if it's a plain number and format it
    const numMatch = content.match(/^(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)\s*%?$/)
    if (numMatch) {
      return <span className="font-medium tabular-nums">{content}</span>
    }

    // Check for currency values
    const currencyMatch = content.match(/^([€$£])\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)/)
    if (currencyMatch) {
      return <span className="font-medium tabular-nums">{content}</span>
    }
  }

  return content
}

export function SantanderTable({ children }: SantanderTableProps) {
  return (
    <div className="santander-table-wrapper my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="santander-table w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  )
}

export function SantanderTableHead({ children }: TableHeaderProps) {
  return <thead className="santander-table-head">{children}</thead>
}

export function SantanderTableBody({ children }: TableBodyProps) {
  return <tbody className="santander-table-body">{children}</tbody>
}

export function SantanderTableRow({ children, isHeader = false }: TableRowProps) {
  if (isHeader) {
    return (
      <tr className="santander-table-row-header bg-[#EC0000] text-white">
        {children}
      </tr>
    )
  }
  return (
    <tr className="santander-table-row border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {children}
    </tr>
  )
}

export function SantanderTableCell({ children, isHeader = false, align = 'left' }: TableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]

  if (isHeader) {
    return (
      <th className={`santander-table-th px-4 py-3 font-semibold ${alignClass} first:rounded-tl-lg last:rounded-tr-lg`}>
        {children}
      </th>
    )
  }

  return (
    <td className={`santander-table-td px-4 py-3 text-gray-700 ${alignClass}`}>
      {formatCellContent(children)}
    </td>
  )
}

// Wrapper components for react-markdown integration
export function MarkdownTable({ children }: { children: React.ReactNode }) {
  return <SantanderTable>{children}</SantanderTable>
}

export function MarkdownThead({ children }: { children: React.ReactNode }) {
  return <SantanderTableHead>{children}</SantanderTableHead>
}

export function MarkdownTbody({ children }: { children: React.ReactNode }) {
  return <SantanderTableBody>{children}</SantanderTableBody>
}

export function MarkdownTr({ children }: { children: React.ReactNode }) {
  // Check if this is a header row by looking at children
  const childArray = React.Children.toArray(children)
  const isHeader = childArray.some((child) => {
    if (React.isValidElement(child)) {
      return child.type === 'th' || (child.props as any)?.isHeader
    }
    return false
  })

  return <SantanderTableRow isHeader={isHeader}>{children}</SantanderTableRow>
}

export function MarkdownTh({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const align = style?.textAlign as 'left' | 'center' | 'right' | undefined
  return <SantanderTableCell isHeader align={align || 'left'}>{children}</SantanderTableCell>
}

export function MarkdownTd({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const align = style?.textAlign as 'left' | 'center' | 'right' | undefined
  return <SantanderTableCell align={align || 'left'}>{children}</SantanderTableCell>
}

export default SantanderTable
