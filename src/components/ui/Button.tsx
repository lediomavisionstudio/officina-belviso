import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large'

type ButtonStyleProps = {
  children: ReactNode
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

function buttonClassName({
  className = '',
  size = 'medium',
  variant = 'primary',
}: Omit<ButtonStyleProps, 'children'>) {
  return `button button--${variant} button--${size} ${className}`.trim()
}

export type ButtonProps = ButtonStyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>

export function Button({
  children,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, size, variant })}
      {...props}
    >
      {children}
    </button>
  )
}

export type ButtonLinkProps = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'>

export function ButtonLink({
  children,
  className,
  size,
  variant,
  ...props
}: ButtonLinkProps) {
  return (
    <a className={buttonClassName({ className, size, variant })} {...props}>
      {children}
    </a>
  )
}
