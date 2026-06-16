import { forwardRef } from 'react'

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    ...props
  },
  ref
) {
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    success:   'btn-success',
    ghost:     'btn-ghost',
  }[variant] ?? 'btn-primary'

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    icon: 'btn-icon',
  }[size] ?? ''

  return (
    <button
      ref={ref}
      className={`btn ${variantClass} ${sizeClass} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="spinner sm white" />
      ) : Icon ? (
        <Icon size={15} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={15} />}
    </button>
  )
})

export default Button
