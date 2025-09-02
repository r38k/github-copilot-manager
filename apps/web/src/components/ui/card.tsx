import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`} {...props} />
}

export function CardHeader({ className = '', ...props }: CardProps) {
  return <div className={`px-4 pt-4 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: CardProps) {
  return <h3 className={`text-base font-semibold text-zinc-800 ${className}`} {...props} />
}

export function CardContent({ className = '', ...props }: CardProps) {
  return <div className={`p-4 pt-2 ${className}`} {...props} />
}

