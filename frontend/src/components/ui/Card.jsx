export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, actions, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      {typeof children === 'string'
        ? <h3 className="card-title">{children}</h3>
        : children}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>
}
