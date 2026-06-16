import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    iconLeft: IconLeft,
    required: isRequired,
    type = 'text',
    className = '',
    ...props
  },
  ref
) {
  const [showPwd, setShowPwd] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPwd ? 'text' : 'password') : type

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {isRequired && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {IconLeft && <IconLeft className="input-icon-left" size={16} />}
        <input
          ref={ref}
          type={inputType}
          className={`form-input ${IconLeft ? 'has-icon-left' : ''} ${isPassword ? 'has-icon-right' : ''} ${error ? 'error' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPwd((v) => !v)}
            tabIndex={-1}
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  )
})

export default Input
