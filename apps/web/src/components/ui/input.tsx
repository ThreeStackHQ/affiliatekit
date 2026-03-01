import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-500' : 'border-gray-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
