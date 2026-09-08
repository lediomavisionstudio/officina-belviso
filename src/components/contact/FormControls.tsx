import type {
  ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import {
  useEffect,
  useRef,
  useState,
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

type MultiSelectProps = FieldBaseProps & {
  name: string
  onChange: (value: string[]) => void
  options: Array<{ label: string; value: string }>
  placeholder: string
  value: string[]
}

export function MultiSelect({
  className = '',
  error,
  helperText,
  id,
  label,
  name,
  onChange,
  options,
  placeholder,
  required,
  value,
}: MultiSelectProps & { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = `${id}-menu`
  const selectedOptions = options.filter((option) => value.includes(option.value))
  const serializedValue = selectedOptions.map((option) => option.label).join(', ')

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const toggleOption = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((currentValue) => currentValue !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <div
      className={`form-field form-multiselect ${className}`.trim()}
      data-form-field={name}
      ref={rootRef}
    >
      <label htmlFor={id} id={`${id}-label`}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <input type="hidden" name={name} value={serializedValue} />
      <button
        aria-controls={menuId}
        aria-describedby={descriptionIds(id, helperText, error)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-invalid={error ? true : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-required={required || undefined}
        className="form-multiselect__trigger"
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span
          className={selectedOptions.length > 0 ? '' : 'form-multiselect__placeholder'}
          id={`${id}-value`}
        >
          {selectedOptions.length > 0
            ? `${selectedOptions.length} ${selectedOptions.length === 1 ? 'intervento selezionato' : 'interventi selezionati'}`
            : placeholder}
        </span>
        <span aria-hidden="true" className="form-multiselect__chevron">⌄</span>
      </button>

      {selectedOptions.length > 0 ? (
        <div className="form-multiselect__chips" aria-label="Interventi selezionati">
          {selectedOptions.map((option) => (
            <span className="form-multiselect__chip" key={option.value}>
              {option.label}
              <button
                aria-label={`Rimuovi ${option.label}`}
                onClick={() => toggleOption(option.value)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-labelledby={`${id}-label`}
          className="form-multiselect__menu"
          id={menuId}
          role="group"
        >
          {options.map((option) => (
            <label key={option.value}>
              <input
                checked={value.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : null}
      <FieldSupport id={id} helperText={helperText} error={error} />
    </div>
  )
}

type PhoneInputProps = FieldBaseProps & {
  numberName: string
  numberValue: string
  onNumberChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPrefixChange: (event: ChangeEvent<HTMLSelectElement>) => void
  prefixId: string
  prefixName: string
  prefixOptions: Array<{ label: string; value: string }>
  prefixValue: string
}

export function PhoneInput({
  error,
  helperText,
  id,
  label,
  numberName,
  numberValue,
  onNumberChange,
  onPrefixChange,
  prefixId,
  prefixName,
  prefixOptions,
  prefixValue,
  required,
}: PhoneInputProps) {
  return (
    <div className="form-field form-phone" data-form-field={numberName}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      <div className="form-phone__controls">
        <select
          aria-label="Prefisso internazionale"
          id={prefixId}
          name={prefixName}
          onChange={onPrefixChange}
          value={prefixValue}
        >
          {prefixOptions.map((option) => (
            <option key={`${option.label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-describedby={descriptionIds(id, helperText, error)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          autoComplete="tel-national"
          id={id}
          inputMode="numeric"
          maxLength={10}
          name={numberName}
          onChange={onNumberChange}
          pattern="[0-9]*"
          placeholder="3331234567"
          required={required}
          type="tel"
          value={numberValue}
        />
      </div>
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
