import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function Card<T extends ElementType = 'article'>({
  as,
  children,
  className = '',
  ...props
}: CardProps<T>) {
  const Component = as ?? 'article'

  return (
    <Component className={`card ${className}`.trim()} {...props}>
      {children}
    </Component>
  )
}

type CardSectionProps = {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return <div className={`card__header ${className}`.trim()}>{children}</div>
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return <div className={`card__body ${className}`.trim()}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return <div className={`card__footer ${className}`.trim()}>{children}</div>
}
