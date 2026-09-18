import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useRef,
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

type SubmissionStatus = 'error' | 'idle' | 'success'

const MAX_PHOTO_FILES = 4
const MAX_PHOTO_BYTES = 4 * 1024 * 1024
const MAX_CV_BYTES = 5 * 1024 * 1024
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

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
  career: ['firstName', 'lastName', 'email', 'phoneNumber', 'privacy'],
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

  const phoneNumber = valueOf(data, 'phoneNumber')
  if (phoneNumber && !/^\d{6,10}$/.test(phoneNumber)) {
    errors.phoneNumber = 'Inserisci un numero compreso tra 6 e 10 cifre.'
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

function fileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function validateAttachments(files: File[], mode: ContactFormMode) {
  if (mode === 'quote') {
    if (files.length > MAX_PHOTO_FILES) {
      return 'Puoi allegare al massimo 4 fotografie.'
    }
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      return 'Ogni fotografia deve pesare al massimo 4 MB.'
    }
    if (files.some((file) => !IMAGE_MIME_TYPES.has(file.type) || !IMAGE_EXTENSIONS.has(fileExtension(file.name)))) {
      return 'Sono consentiti solo file JPG, JPEG, PNG o WEBP.'
    }
    return ''
  }

  if (files.length > 1) return 'Puoi allegare un solo curriculum.'
  if (files.some((file) => file.size > MAX_CV_BYTES)) {
    return 'Il curriculum deve pesare al massimo 5 MB.'
  }
  if (files.some((file) => file.type !== 'application/pdf' || fileExtension(file.name) !== 'pdf')) {
    return 'Il curriculum deve essere un file PDF.'
  }
  return ''
}

export function ContactForm({ mode }: ContactFormProps) {
  const { selectedInterventions, setSelectedInterventions } = useQuoteRequest()
  const formId = useId().replace(/:/g, '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [attachments, setAttachments] = useState<File[]>([])
  const [phonePrefix, setPhonePrefix] = useState(phonePrefixOptions[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle')
  const submissionLock = useRef(false)
  const id = (name: string) => `${formId}-${name}`

  const clearError = (fieldName: string) => {
    setErrors((current) => {
      if (!current[fieldName]) return current
      const next = { ...current }
      delete next[fieldName]
      return next
    })
    if (status) {
      setStatus('')
      setSubmissionStatus('idle')
    }
  }

  const clearFieldError = (event: ChangeEvent<HTMLFormElement>) => {
    const fieldName = event.target.name
    if (!fieldName) return
    clearError(fieldName)
  }

  const attachmentFieldName = mode === 'quote' ? 'photos' : 'cv'
  const handleFilesChange = (newFiles: File[]) => {
    const nextFiles = [...attachments, ...newFiles]
    const attachmentError = validateAttachments(nextFiles, mode)
    if (attachmentError) {
      setErrors((current) => ({ ...current, [attachmentFieldName]: attachmentError }))
      return
    }
    setAttachments(nextFiles)
    clearError(attachmentFieldName)
  }

  const handleFileRemove = (index: number) => {
    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))
    clearError(attachmentFieldName)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionLock.current) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const nextErrors = validateForm(formData, mode)
    const attachmentError = validateAttachments(attachments, mode)
    if (attachmentError) nextErrors[attachmentFieldName] = attachmentError
    setErrors(nextErrors)

    const firstInvalidField = Object.keys(nextErrors)[0]
    if (firstInvalidField) {
      setStatus('Controlla i campi evidenziati e completa le informazioni richieste.')
      setSubmissionStatus('error')
      const fieldRoot = form.querySelector<HTMLElement>(
        `[data-form-field="${firstInvalidField}"]`,
      )
      const namedControl = form.elements.namedItem(firstInvalidField)
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

    const payload = mode === 'quote'
      ? {
          firstName: valueOf(formData, 'firstName'),
          lastName: valueOf(formData, 'lastName'),
          company: valueOf(formData, 'company'),
          email: valueOf(formData, 'email'),
          phonePrefix: valueOf(formData, 'phonePrefix'),
          phonePrefixCountry: valueOf(formData, 'phonePrefixCountry'),
          phoneNumber: valueOf(formData, 'phoneNumber'),
          phone: valueOf(formData, 'phone'),
          vehicleBrand: valueOf(formData, 'vehicleBrand'),
          vehicleModel: valueOf(formData, 'vehicleModel'),
          registrationYear: valueOf(formData, 'registrationYear'),
          vin: valueOf(formData, 'vin'),
          licensePlate: valueOf(formData, 'licensePlate'),
          vehicleRunning: valueOf(formData, 'vehicleRunning'),
          serviceType: valueOf(formData, 'serviceType'),
          problemDescription: valueOf(formData, 'problemDescription'),
          privacy: formData.get('privacy') === 'on',
          website: valueOf(formData, 'website'),
        }
      : {
          firstName: valueOf(formData, 'firstName'),
          lastName: valueOf(formData, 'lastName'),
          email: valueOf(formData, 'email'),
          phonePrefix: valueOf(formData, 'phonePrefix'),
          phonePrefixCountry: valueOf(formData, 'phonePrefixCountry'),
          phoneNumber: valueOf(formData, 'phoneNumber'),
          phone: valueOf(formData, 'phone'),
          role: valueOf(formData, 'role'),
          message: valueOf(formData, 'message'),
          privacy: formData.get('privacy') === 'on',
          website: valueOf(formData, 'website'),
        }

    submissionLock.current = true
    setIsSubmitting(true)
    setStatus('')
    setSubmissionStatus('idle')

    try {
      const requestBody = new FormData()
      Object.entries(payload).forEach(([name, value]) => {
        requestBody.append(name, String(value))
      })
      attachments.forEach((file) => {
        requestBody.append(attachmentFieldName, file, file.name)
      })

      const response = await fetch(mode === 'quote' ? '/api/contact' : '/api/careers', {
        method: 'POST',
        body: requestBody,
      })

      if (!response.ok) throw new Error('Submission failed')

      form.reset()
      setPhonePrefix(phonePrefixOptions[0])
      setPhoneNumber('')
      setSelectedInterventions([])
      setAttachments([])
      setErrors({})
      setSubmissionStatus('success')
      setStatus(
        mode === 'quote'
          ? 'Richiesta inviata correttamente. Ti ricontatteremo nel più breve tempo possibile.'
          : 'Candidatura inviata correttamente. Grazie per averci contattato.',
      )
    } catch {
      setSubmissionStatus('error')
      setStatus('Non è stato possibile inviare la richiesta. Riprova tra qualche minuto.')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
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
      <input
        aria-hidden="true"
        autoComplete="off"
        hidden
        name="website"
        tabIndex={-1}
        type="text"
      />
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
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              id={id('photos')}
              label="Fotografie del veicolo"
              description="Fino a 4 fotografie JPG, PNG o WEBP, massimo 4 MB ciascuna."
              error={errors.photos}
              files={attachments}
              maxFiles={MAX_PHOTO_FILES}
              name="photos"
              onFilesChange={handleFilesChange}
              onRemove={handleFileRemove}
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
            accept="application/pdf"
            disabled={isSubmitting}
            id={id('cv')}
            label="Curriculum vitae"
            description="Un file PDF, massimo 5 MB."
            error={errors.cv}
            files={attachments}
            maxFiles={1}
            name="cv"
            onFilesChange={handleFilesChange}
            onRemove={handleFileRemove}
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
        <Button className="contact-form__submit" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? 'Invio in corso…'
            : mode === 'quote'
              ? 'Conferma invio'
              : 'Invia candidatura'}
        </Button>
        <p
          className="contact-form__status"
          role={Object.keys(errors).length > 0 || submissionStatus === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status}
        </p>
      </div>
    </form>
  )
}
