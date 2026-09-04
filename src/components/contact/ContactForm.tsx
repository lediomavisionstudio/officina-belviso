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
import { useQuoteRequest } from '../../hooks/useQuoteRequest'
import {
  Button,
  Checkbox,
  Input,
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
    'email',
    'phone',
    'vehicleBrand',
    'vehicleModel',
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
  vehicleBrand: 'Seleziona la marca del veicolo.',
  vehicleModel: 'Inserisci il modello del veicolo.',
  vehicleRunning: 'Indica se il veicolo è marciante.',
  serviceType: 'Seleziona la tipologia di intervento.',
  problemDescription: 'Descrivi il problema.',
  privacy: 'È necessario accettare l’informativa privacy.',
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

  const phone = valueOf(data, 'phone')
  const phoneDigits = phone.replace(/\D/g, '')
  if (phone && (!/^[+\d\s()./-]+$/.test(phone) || phoneDigits.length < 6)) {
    errors.phone = 'Inserisci un numero di telefono valido.'
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
  const { serviceType, setServiceType } = useQuoteRequest()
  const formId = useId().replace(/:/g, '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState('')
  const id = (name: string) => `${formId}-${name}`

  const clearFieldError = (event: ChangeEvent<HTMLFormElement>) => {
    const fieldName = event.target.name
    if (status) setStatus('')
    if (!fieldName || !errors[fieldName]) return

    setErrors((current) => {
      const next = { ...current }
      delete next[fieldName]
      return next
    })
    setStatus('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(new FormData(event.currentTarget), mode)
    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) {
      setStatus('Controlla i campi evidenziati e completa le informazioni richieste.')
      const control = event.currentTarget.elements.namedItem(firstInvalidField)
      if (control instanceof HTMLElement) control.focus()
      else if (control instanceof RadioNodeList) {
        const firstRadio = control[0]
        if (firstRadio instanceof HTMLElement) firstRadio.focus()
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
          required
        />
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
              required
            />
            <Input
              id={id('vehicleModel')}
              name="vehicleModel"
              label="Modello del veicolo"
              error={errors.vehicleModel}
              required
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
            <Input id={id('vin')} name="vin" label="Numero di telaio (VIN)" />
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
            <Select
              className="form-field--full"
              id={id('serviceType')}
              name="serviceType"
              label="Tipologia di intervento"
              placeholder="Seleziona un intervento"
              options={quoteServiceOptions}
              value={serviceType}
              onChange={(event) => {
                const nextValue = event.currentTarget.value
                setServiceType(isQuoteServiceId(nextValue) ? nextValue : '')
              }}
              error={serviceType ? undefined : errors.serviceType}
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
