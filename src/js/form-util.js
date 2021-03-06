import { $, $$, downloadBlob } from './dom-utils'
import { getFormattedDate } from './util'
import pdfBase from '../certificate.pdf'
import { generatePdf } from './pdf-util'

export const formProfileConditions = {
  '#field-firstname': {
    length: 1,
  },
  '#field-lastname': {
    length: 1,
  },
  '#field-birthday': {
    pattern: /^([0][1-9]|[1-2][0-9]|30|31)\/([0][1-9]|10|11|12)\/(19[0-9][0-9]|20[0-1][0-9]|2020)/g,
  },
  '#field-placeofbirth': {
    length: 1,
  },
  '#field-address': {
    length: 1,
  },
  '#field-city': {
    length: 1,
  },
  '#field-zipcode': {
    pattern: /\d{5}/g,
  },
}

const formAttestationConditions = {
  '#field-datesortie': {
    pattern: /\d{4}-\d{2}-\d{2}/g,
  },
  '#field-heuresortie': {
    pattern: /\d{2}:\d{2}/g,
  },
  '#field-creationHour': {
    pattern: /\d{2}:\d{2}/g,
  },
}

export function validateAriaFields(conditions) {
  return Object.keys(conditions)
    .map((field) => {
      const fieldData = conditions[field]
      const pattern = fieldData.pattern
      const length = fieldData.length
      const isInvalidPattern = pattern && !$(field).value.match(pattern)
      const isInvalidLength = length && !$(field).value.length

      const isInvalid = !!(isInvalidPattern || isInvalidLength)

      $(field).setAttribute('aria-invalid', isInvalid)
      if (isInvalid) {
        $(field).focus()
      }
      return isInvalid
    })
    .includes(true)
}

export function setReleaseDateTime(releaseDateInput) {
  const loadedDate = new Date()
  releaseDateInput.value = getFormattedDate(loadedDate)
}

export function getProfile(formInputs) {
  const profile = JSON.parse($('select').value)

  const fields = { ...profile }
  for (const field of formInputs) {
    let value = field.value
    if (field.id === 'field-datesortie') {
      const dateSortie = field.value.split('-')
      value = `${dateSortie[2]}/${dateSortie[1]}/${dateSortie[0]}`
    }
    fields[field.id.substring('field-'.length)] = value
  }
  return fields
}

export function getReasons(reasonInputs) {
  const reasons = reasonInputs
    .filter((input) => input.checked)
    .map((input) => input.value)
    .join(', ')
  return reasons
}

export function prepareInputs(
  formInputs,
  reasonInputs,
  reasonFieldset,
  reasonAlert,
  snackbar
) {
  formInputs.forEach((input) => {
    const exempleElt = input.parentNode.parentNode.querySelector('.exemple')
    const validitySpan = input.parentNode.parentNode.querySelector('.validity')
    if (input.placeholder && exempleElt) {
      input.addEventListener('input', (event) => {
        if (input.value) {
          exempleElt.innerHTML = 'ex.&nbsp;: ' + input.placeholder
          validitySpan.removeAttribute('hidden')
        } else {
          exempleElt.innerHTML = ''
        }
      })
    }
  })

  reasonInputs.forEach((radioInput) => {
    radioInput.addEventListener('change', function (event) {
      const isInError = reasonInputs.every((input) => !input.checked)
      reasonFieldset.classList.toggle('fieldset-error', isInError)
      reasonAlert.classList.toggle('hidden', !isInError)
    })
  })

  $('#generate-btn').addEventListener('click', generateAttestationListener)
}

export function prepareForm() {
  const formInputs = $$('#form-attestation input')
  const snackbar = $('#snackbar')
  const reasonInputs = [...$$('input[name="field-reason"]')]
  const reasonFieldset = $('#reason-fieldset')
  const reasonAlert = reasonFieldset.querySelector('.msg-alert')
  const releaseDateInput = $('#field-datesortie')
  setReleaseDateTime(releaseDateInput)
  prepareInputs(formInputs, reasonInputs, reasonFieldset, reasonAlert, snackbar)
}

export const submitForm = async () => {
  const formInputs = $$('#form-attestation input')

  const reasonInputs = [...$$('input[name="field-reason"]')]
  const reasonFieldset = $('#reason-fieldset')
  const reasonAlert = reasonFieldset.querySelector('.msg-alert')

  const reasons = getReasons(reasonInputs)
  if (!reasons) {
    reasonFieldset.classList.add('fieldset-error')
    reasonAlert.classList.remove('hidden')
    reasonFieldset.scrollIntoView && reasonFieldset.scrollIntoView()
    return
  }

  const invalid = validateAriaFields(formAttestationConditions)
  if (invalid) {
    return
  }

  const profile = getProfile(formInputs)
  const pdfBlob = await generatePdf(profile, reasons, pdfBase)

  const creationInstant = new Date()
  const creationDate = creationInstant.toLocaleDateString('fr-CA')

  downloadBlob(
    pdfBlob,
    `attestation-${creationDate}_${profile.creationHour}.pdf`
  )

  snackbar.classList.remove('d-none')
  setTimeout(() => snackbar.classList.add('show'), 100)

  setTimeout(function () {
    snackbar.classList.remove('show')
    setTimeout(() => snackbar.classList.add('d-none'), 500)
  }, 6000)
}

export function generateAttestationListener(event) {
  event.preventDefault()
  submitForm()
}
