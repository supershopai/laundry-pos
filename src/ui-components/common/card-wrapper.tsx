/*
 * Copyright 2024 RSC-Labs, https://rsoftcon.com/
 *
 * MIT License
 */

import React from 'react'

type CardWrapperProps = {
  children: React.ReactNode
  style?: React.CSSProperties
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ children, style }) => {
  const baseStyle: React.CSSProperties = {
    border: '1px solid var(--ui-border-base)',
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: 'var(--ui-bg-base)',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    transform: 'translateY(0)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'auto',
    overflowY: 'hidden'
  }

  const merged: React.CSSProperties = { ...baseStyle, ...(style || {}) }

  return (
    <div
      style={merged}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--ui-border-interactive)'
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--ui-border-base)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
      }}
    >
      {children}
    </div>
  )
}


