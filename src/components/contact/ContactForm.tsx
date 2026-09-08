import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useState,
} from 'react'
import {
  isQuoteServiceId,
  quoteServiceOptions,
} from '../../config/services'
import { phonePrefixOptions } from '../../config/phonePrefixes'
import { useQuoteRequest } from '../../hooks/useQuoteRequest'
import {
  Button,
  Checkbox,
  Input,
  MultiSelect,
  PhoneInput,
  RadioGroup,
  Select,
  Textarea,
  UploadField,
} from './FormControls'

export type ContactFormMode = 'quote' | 'career'

type ContactFormProps = {
  mode: ContactFormMode
}

type FormErrors = Record<string, string>

const vehicleBrands = [
  'Mercedes-Benz',
  'Volvo',
  'Scania',
  'MAN',
  'DAF',
  'Iveco',
  'Renault Trucks',
  'Altro',
].map((label) => ({ label, value: label }))

const requiredByMode: Record<ContactFormMode, string[]> = {
  quote: [
    'firstName',
    'lastName',
    'phoneNumber',
    'vin',
    'vehicleRunning',
    'serviceType',
    'problemDescription',
    'privacy',
  ],
  career: ['firstName', 'lastName', 'email', 'phone', 'privacy'],
}

const requiredMessage: Record<string, string> = {
  firstName: 'Inserisci il nome.',
  lastName: 'Inserisci il cognome.',
  email: 'Inserisci l’indirizzo email.',
  phone: 'Inserisci il numero di telefono.',
  phoneNumber: 'Inserisci un numero di telefono.',
  vin: 'Inserisci il numero di telaio.',
  vehicleRunning: 'Indica se il veicolo è marciante.',
  serviceType: 'Seleziona almeno una tipologia di intervento.',
  problemDescription: 'Descrivi il problema.',
  privacy: 'Devi accettare l’informativa privacy.',
}

function valueOf(data: FormData, name: string) {
  return String(data.get(name) ?? '').trim()
}

function validateForm(data: FormData, mode: ContactFormMode) {
  const errors: FormErrors = {}

  requiredByMode[mode].forEach((name) => {
    if (!valueOf(data, name)) errors[name] = requiredMessage[name]
  })

  const email = valueOf(data, 'email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Inserisci un indirizzo email valido.'
  }

  if (mode === 'quote') {
    const phoneNumber = valueOf(data, 'phoneNumber')
    if (phoneNumber && !/^\d{1,10}$/.test(phoneNumber)) {
      errors.phoneNumber = 'Il numero può contenere al massimo 10 cifre.'
    }
  } else {
    const phone = valueOf(data, 'phone')
    const phoneDigits = phone.replace(/\D/g, '')
    if (phone && (!/^[+\d\s()./-]+$/.test(phone) || phoneDigits.length < 6)) {
      errors.phone = 'Inserisci un numero di telefono valido.'
    }
  }

  const registrationYear = valueOf(data, 'registrationYear')
  const maximumRegistrationYear = new Date().getFullYear() + 1
  const registrationYearNumber = Number.parseInt(registrationYear, 10)
  if (
    registrationYear &&
    (!/^\d{4}$/.test(registrationYear) ||
      registrationYearNumber < 1900 ||
      registrationYearNumber > maximumRegistrationYear)
  ) {
    errors.registrationYear = `Inserisci un anno compreso tra 1900 e ${maximumRegistrationYear}.`
  }

  return errors
}

export function ContactForm({ mode }: ContactFormProps) {
  const { selectedInterventions, setSelectedInterventions } = useQuoteRequest()
  const formId = useId().replace(/:/g, '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [phonePrefix, setPhonePrefix] = useState(phonePrefixOptions[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('')
  const id = (name: string) => `${formId}-${name}`

  const clearError = (fieldName: string) => {
    setErrors((current) => {
      if (!current[fieldName]) return current
      const next = { ...current }
      delete next[fieldName]
      return next
    })
    if (status) setStatus('')
  }

  const clearFieldError = (event: ChangeEvent<HTMLFormElement>) => {
    const fieldName = event.target.name
    if (!fieldName) return
    clearError(fieldName)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextErrors = validateForm(formData, mode)
    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) {
      setStatus('Controlla i campi evidenziati e completa le informazioni richieste.')
      const fieldRoot = event.currentTarget.querySelector<HTMLElement>(
        `[data-form-field="${firstInvalidField}"]`,
      )
      const namedControl = event.currentTarget.elements.namedItem(firstInvalidField)
      const control = fieldRoot?.querySelector<HTMLElement>('button, input, select, textarea')
        ?? (namedControl instanceof HTMLElement ? namedControl : null)
        ?? (namedControl instanceof RadioNodeList && namedControl[0] instanceof HTMLElement
          ? namedControl[0]
          : null)

      if (control) {
        control.focus({ preventScroll: true })
        control.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setStatus(
      'Le informazioni sono complete. L’invio sarà disponibile non appena il servizio verrà attivato.',
    )
  }

  return (
    <form
      className="contact-form"
      aria-label={
        mode === 'quote'
          ? 'Modulo per richiedere un preventivo'
          : 'Modulo per inviare una candidatura'
      }
      noValidate
      onChange={clearFieldError}
      onSubmit={handleSubmit}
    >
      <fieldset className="contact-form__group">
        <legend>Dati personali</legend>
        <Input
          id={id('firstName')}
          name="firstName"
          label="Nome"
          autoComplete="given-name"
          error={errors.firstName}
          required
        />
        <Input
          id={id('lastName')}
          name="lastName"
          label="Cognome"
          autoComplete="family-name"
          error={errors.lastName}
          required
        />
        {mode === 'quote' ? (
          <Input
            id={id('company')}
            name="company"
            label="Azienda"
            autoComplete="organization"
          />
        ) : null}
        <Input
          id={id('email')}
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email}
          required={mode === 'career'}
        />
        {mode === 'quote' ? (
          <>
            <input name="phonePrefix" type="hidden" value={phonePrefix.dialCode} />
            <input name="phone" type="hidden" value={`${phonePrefix.dialCode}${phoneNumber}`} />
            <PhoneInput
              id={id('phoneNumber')}
              prefixId={id('phonePrefixCountry')}
              prefixName="phonePrefixCountry"
              label="Telefono"
              prefixOptions={phonePrefixOptions}
              prefixValue={phonePrefix.value}
              numberName="phoneNumber"
              numberValue={phoneNumber}
              onPrefixChange={(event) => {
                const nextPrefix = phonePrefixOptions.find(
                  (option) => option.value === event.currentTarget.value,
                )
                if (nextPrefix) setPhonePrefix(nextPrefix)
              }}
              onNumberChange={(event) => {
                setPhoneNumber(event.currentTarget.value.replace(/\D/g, '').slice(0, 10))
              }}
              error={errors.phoneNumber}
              required
            />
          </>
        ) : (
          <Input
            id={id('phone')}
            name="phone"
            label="Telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            error={errors.phone}
            required
          />
        )}
      </fieldset>

      {mode === 'quote' ? (
        <>
          <fieldset className="contact-form__group">
            <legend>Dati del veicolo</legend>
            <Select
              id={id('vehicleBrand')}
              name="vehicleBrand"
              label="Marca del veicolo"
              placeholder="Seleziona una marca"
              options={vehicleBrands}
              error={errors.vehicleBrand}
            />
            <Input
              id={id('vehicleModel')}
              name="vehicleModel"
              label="Modello del veicolo"
              error={errors.vehicleModel}
            />
            <Input
              id={id('registrationYear')}
              name="registrationYear"
              label="Anno di immatricolazione"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              error={errors.registrationYear}
            />
            <Input
              id={id('vin')}
              name="vin"
              label="Numero di telaio (VIN)"
              error={errors.vin}
              required
            />
            <Input id={id('licensePlate')} name="licensePlate" label="Targa" />
            <RadioGroup
              id={id('vehicleRunning')}
              name="vehicleRunning"
              label="Veicolo marciante?"
              options={[
                { label: 'Sì', value: 'yes' },
                { label: 'No', value: 'no' },
              ]}
              error={errors.vehicleRunning}
              required
            />
          </fieldset>

          <fieldset className="contact-form__group">
            <legend>Dettagli della richiesta</legend>
            <MultiSelect
              className="form-field--full"
              id={id('serviceType')}
              name="serviceType"
              label="Tipologia di intervento"
              placeholder="Seleziona uno o più interventi"
              options={quoteServiceOptions}
              value={selectedInterventions}
              onChange={(nextValues) => {
                const validValues = nextValues.filter(isQuoteServiceId)
                setSelectedInterventions(validValues)
                clearError('serviceType')
              }}
              error={selectedInterventions.length > 0 ? undefined : errors.serviceType}
              required
            />
            <Textarea
              className="form-field--full"
              id={id('problemDescription')}
              name="problemDescription"
              label="Descrizione del problema"
              rows={5}
              error={errors.problemDescription}
              required
            />
            <UploadField
              id={id('photos')}
              label="Fotografie del veicolo"
              description="La funzione di caricamento sarà disponibile con l’attivazione del servizio di invio."
            />
          </fieldset>
        </>
      ) : (
        <fieldset className="contact-form__group">
          <legend>Candidatura</legend>
          <Input
            className="form-field--full"
            id={id('role')}
            name="role"
            label="Posizione di interesse"
          />
          <Textarea
            className="form-field--full"
            id={id('message')}
            name="message"
            label="Presentazione"
            rows={5}
          />
          <UploadField
            id={id('cv')}
            label="Curriculum vitae"
            description="La funzione di caricamento sarà disponibile con l’attivazione del servizio di invio."
          />
        </fieldset>
      )}

      <Checkbox
        id={id('privacy')}
        name="privacy"
        label="Ho letto e accetto l’informativa privacy"
        error={errors.privacy}
        required
      />

      <div className="contact-form__footer">
        <Button className="contact-form__submit" type="submit">
          {mode === 'quote' ? 'Conferma invio' : 'Invia candidatura'}
        </Button>
        <p
          className="contact-form__status"
          role={Object.keys(errors).length > 0 ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status}
        </p>
      </div>
    </form>
  )
}
