import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
export { Button } from '../ui/Button'

type FieldBaseProps = {
  error?: string
  helperText?: string
  id: string
  label: string
  required?: boolean
}

function descriptionIds(id: string, helperText?: string, error?: string) {
  return [
    helperText ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined
}

function FieldSupport({
  error,
  helperText,
  id,
}: Pick<FieldBaseProps, 'error' | 'helperText' | 'id'>) {
  return (
    <>
      {helperText ? (
        <span className="form-field__help" id={`${id}-help`}>
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span className="form-field__error" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </>
  )
}

type InputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'>

export function Input({
  className = '',
  error,
  helperText,
  id,
  label,
  required,
  ...props
}: InputProps) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input
        {...props}
        id={id}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(id, helperText, error)}
      />
      <FieldSupport id={id} helperText={helperText} error={error} />
    </div>
  )
}

type TextareaProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'required'>

export function Textarea({
  className = '',
  error,
  helperText,
  id,
  label,
  required,
  ...props
}: TextareaProps) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <textarea
        {...props}
        id={id}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(id, helperText, error)}
      />
      <FieldSupport id={id} helperText={helperText} error={error} />
    </div>
  )
}

type SelectProps = FieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'> & {
    options: Array<{ label: string; value: string }>
    placeholder: string
  }

export function Select({
  className = '',
  error,
  helperText,
  id,
  label,
  options,
  placeholder,
  required,
  defaultValue,
  value,
  ...props
}: SelectProps) {
  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <select
        {...props}
        id={id}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds(id, helperText, error)}
        {...(value === undefined
          ? { defaultValue: defaultValue ?? '' }
          : { value })}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldSupport id={id} helperText={helperText} error={error} />
    </div>
  )
}

type RadioGroupProps = FieldBaseProps & {
  name: string
  options: Array<{ label: string; value: string }>
}

export function RadioGroup({
  error,
  helperText,
  id,
  label,
  name,
  options,
  required,
}: RadioGroupProps) {
  return (
    <fieldset
      className="form-field form-radio-group"
      aria-invalid={error ? true : undefined}
      aria-describedby={descriptionIds(id, helperText, error)}
    >
      <legend>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </legend>
      <div className="form-radio-group__options">
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" name={name} value={option.value} required={required} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <FieldSupport id={id} helperText={helperText} error={error} />
    </fieldset>
  )
}

type CheckboxProps = FieldBaseProps & {
  name: string
}

export function Checkbox({
  error,
  helperText,
  id,
  label,
  name,
  required,
}: CheckboxProps) {
  return (
    <div className="form-field form-checkbox">
      <label htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionIds(id, helperText, error)}
        />
        <span>
          {label} {required ? <span aria-hidden="true">*</span> : null}
        </span>
      </label>
      <FieldSupport id={id} helperText={helperText} error={error} />
    </div>
  )
}

type UploadFieldProps = {
  description: string
  id: string
  label: string
}

export function UploadField({ description, id, label }: UploadFieldProps) {
  return (
    <div className="form-field form-upload" role="group" aria-labelledby={`${id}-label`}>
      <span className="form-upload__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="form-upload__placeholder">
        <span aria-hidden="true">+</span>
        <p>{description}</p>
      </div>
    </div>
  )
}
