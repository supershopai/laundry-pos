import React from 'react'

interface MedusaLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  tabs?: React.ReactNode
}

export const MedusaLayout: React.FC<MedusaLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  actions, 
  tabs 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--ui-bg-base)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--ui-border-base)',
        backgroundColor: 'var(--ui-bg-base)',
        padding: '24px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tabs ? '20px' : '0'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'var(--ui-fg-base)',
              margin: '0 0 4px 0',
              lineHeight: '1.2'
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontSize: '14px',
                color: 'var(--ui-fg-subtle)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {actions}
            </div>
          )}
        </div>
        {tabs && (
          <div style={{
            display: 'flex',
            gap: '2px'
          }}>
            {tabs}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </div>
    </div>
  )
}

interface MedusaTabProps {
  label: string
  active?: boolean
  onClick?: () => void
}

export const MedusaTab: React.FC<MedusaTabProps> = ({ label, active = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: active ? 'var(--ui-bg-component)' : 'transparent',
        color: active ? 'var(--ui-fg-base)' : 'var(--ui-fg-subtle)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--ui-bg-subtle-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {label}
    </button>
  )
}

interface MedusaButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  disabled?: boolean
}

export const MedusaButton: React.FC<MedusaButtonProps> = ({ 
  children, 
  variant = 'secondary', 
  size = 'medium',
  onClick,
  disabled = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? 'var(--ui-bg-disabled)' : 'var(--ui-bg-interactive)',
          color: 'var(--ui-fg-on-inverted)',
          border: 'none'
        }
      case 'danger':
        return {
          backgroundColor: disabled ? 'var(--ui-bg-disabled)' : 'var(--ui-bg-error)',
          color: 'var(--ui-fg-on-inverted)',
          border: 'none'
        }
      default:
        return {
          backgroundColor: disabled ? 'var(--ui-bg-disabled)' : 'var(--ui-bg-base)',
          color: disabled ? 'var(--ui-fg-disabled)' : 'var(--ui-fg-base)',
          border: '1px solid var(--ui-border-base)'
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '6px 12px', fontSize: '13px' }
      case 'large':
        return { padding: '12px 20px', fontSize: '16px' }
      default:
        return { padding: '8px 16px', fontSize: '14px' }
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        borderRadius: '6px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {children}
    </button>
  )
}

interface MedusaContainerProps {
  children: React.ReactNode
  className?: string
}

export const MedusaContainer: React.FC<MedusaContainerProps> = ({ children }) => {
  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: 'var(--ui-bg-base)',
        borderRadius: '8px',
        border: '1px solid var(--ui-border-base)',
        minHeight: '100%'
      }}>
        {children}
      </div>
    </div>
  )
}

interface MedusaTableProps {
  children: React.ReactNode
}

export const MedusaTable: React.FC<MedusaTableProps> = ({ children }) => {
  return (
    <div style={{
      overflow: 'auto'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        {children}
      </table>
    </div>
  )
}

interface MedusaTableHeaderProps {
  children: React.ReactNode
}

export const MedusaTableHeader: React.FC<MedusaTableHeaderProps> = ({ children }) => {
  return (
    <thead style={{
      backgroundColor: 'var(--ui-bg-subtle)',
      borderBottom: '1px solid var(--ui-border-base)'
    }}>
      {children}
    </thead>
  )
}

interface MedusaTableRowProps {
  children: React.ReactNode
}

export const MedusaTableRow: React.FC<MedusaTableRowProps> = ({ children }) => {
  return (
    <tr style={{
      borderBottom: '1px solid var(--ui-border-base)',
      transition: 'background-color 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--ui-bg-subtle-hover)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
    >
      {children}
    </tr>
  )
}

interface MedusaTableCellProps {
  children: React.ReactNode
  header?: boolean
}

export const MedusaTableCell: React.FC<MedusaTableCellProps> = ({ children, header = false }) => {
  const CellComponent = header ? 'th' : 'td'
  
  return (
    <CellComponent style={{
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '14px',
      color: header ? 'var(--ui-fg-subtle)' : 'var(--ui-fg-base)',
      fontWeight: header ? '600' : '400'
    }}>
      {children}
    </CellComponent>
  )
}
