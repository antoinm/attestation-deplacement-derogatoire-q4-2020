import 'bootstrap/dist/css/bootstrap.min.css'

import '../css/main.css'

import formData from '../form-data.json'
import formProfileData from '../profile-data.json'
import {
  prepareForm,
  generateAttestationListener,
  formProfileConditions,
  validateAriaFields,
} from './form-util'
import { addSlash } from './util'

import { $, $$, appendTo, createElement } from './dom-utils'

const createTitle = () => {
  const div = createElement('div', { className: 'form-group' })
  const appendToDiv = appendTo(div)
  const p = createElement('a', {
    className: 'msg-info',
    id: 'add-profile-btn',
    innerHTML: 'Ajouter un profil',
  })
  appendToDiv(p)

  return [div]
}
// createElement('div', { className: 'form-group' })

const getCurrentTime = () => {
  const date = new Date()
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const createProfileSelector = () => {
  const selectElement = createElement('select', { className: 'form-group' })
  const appendToSelect = appendTo(selectElement)
  let savedProfiles = []
  const savedProfilesSerialized = localStorage.getItem('PROFILES')
  if (savedProfilesSerialized === null) return
  else savedProfiles = JSON.parse(savedProfilesSerialized)

  for (let profile of savedProfiles) {
    const option = createElement('option', {
      innerHTML: `${profile.firstname} ${profile.address}`,
      value: JSON.stringify(profile),
    })
    appendToSelect(option)
  }

  return selectElement
}

const createFormGroup = ({
  autocomplete = false,
  autofocus = false,
  inputmode,
  label,
  max,
  min,
  maxlength,
  minlength,
  name,
  pattern,
  placeholder = '',
  type = 'text',
}) => {
  const formGroup = createElement('div', { className: 'form-group' })
  const labelAttrs = {
    for: `field-${name}`,
    id: `field-${name}-label`,
    innerHTML: label,
  }
  const labelEl = createElement('label', labelAttrs)

  const inputGroup = createElement('div', {
    className: 'input-group',
  })
  const inputAttrs = {
    autocomplete,
    autofocus,
    className: 'form-control',
    id: `field-${name}`,
    inputmode,
    min,
    max,
    minlength,
    maxlength,
    name,
    pattern,
    placeholder,
    required: true,
    type,
  }

  const input = createElement('input', inputAttrs)

  if (name === 'heuresortie') {
    input.value = getCurrentTime()
  }

  const validityAttrs = {
    className: 'validity',
  }
  const validity = createElement('span', validityAttrs)

  const appendToFormGroup = appendTo(formGroup)
  appendToFormGroup(labelEl)
  appendToFormGroup(inputGroup)

  const appendToInputGroup = appendTo(inputGroup)
  appendToInputGroup(input)
  appendToInputGroup(validity)

  return formGroup
}

const createReasonField = (reasonData) => {
  const formReasonAttrs = { className: 'form-checkbox' }
  const formReason = createElement('div', formReasonAttrs)
  const appendToReason = appendTo(formReason)

  const id = `checkbox-${reasonData.code}`
  const inputReasonAttrs = {
    type: 'checkbox',
    id,
    name: 'field-reason',
    value: reasonData.code,
  }
  const inputReason = createElement('input', inputReasonAttrs)

  const labelAttrs = {
    innerHTML: reasonData.label,
    className: 'form-checkbox-label',
    for: id,
  }
  const label = createElement('label', labelAttrs)

  appendToReason([inputReason, label])
  return formReason
}

const createReasonFieldset = (reasonsData) => {
  const fieldsetAttrs = {
    id: 'reason-fieldset',
    className: 'fieldset',
  }

  const fieldset = createElement('fieldset', fieldsetAttrs)
  const appendToFieldset = appendTo(fieldset)

  const legendAttrs = {
    className: 'legend titre-3',
    innerHTML: 'Choisissez un motif de déplacement',
  }
  const legend = createElement('legend', legendAttrs)

  const textAlertAttrs = {
    className: 'msg-alert hidden',
    innerHTML: 'Veuillez choisir un motif',
  }
  const textAlert = createElement('p', textAlertAttrs)

  const textSubscribeReasonAttrs = {
    innerHTML:
      'certifie que mon déplacement est lié au motif suivant (cocher la case) autorisé par le décret n°2020-1310 du 29 octobre 2020 prescrivant les mesures générales nécessaires pour faire face à l\'épidémie de Covid19 dans le cadre de l\'état d\'urgence sanitaire  <a class="footnote" href="#footnote1">[1]</a>&nbsp;:',
  }

  const textSubscribeReason = createElement('p', textSubscribeReasonAttrs)

  const reasonsFields = reasonsData.items.map(createReasonField)

  appendToFieldset([legend, textAlert, textSubscribeReason, ...reasonsFields])
  // Créer un form-checkbox par motif
  return fieldset
}

export function createFormAttestation() {
  $('#profile-btn').style.display = 'none'
  $('#my-profiles').style.display = 'none'
  $('#generate-btn').style.display = ''
  const form = $('#form-attestation')
  // Évite de recréer le formulaire s'il est déjà créé par react-snap (ou un autre outil de prerender)
  if (form.innerHTML !== '') {
    return
  }

  const appendToForm = appendTo(form)

  const formFirstPart = formData
    .flat(1)
    .filter((field) => field.key !== 'reason')
    .filter((field) => !field.isHidden)
    .map((field, index) => {
      const formGroup = createFormGroup({
        autofocus: index === 0,
        ...field,
        name: field.key,
      })

      return formGroup
    })

  const reasonsData = formData.flat(1).find((field) => field.key === 'reason')

  const reasonFieldset = createReasonFieldset(reasonsData)
  appendToForm([
    ...createTitle(),
    createProfileSelector(),
    ...formFirstPart,
    reasonFieldset,
  ])

  $('#add-profile-btn').addEventListener('click', async (event) => {
    toggleForm('profile')
  })
}

export function createFormProfile() {
  $('#profile-btn').style.display = ''
  $('#my-profiles').style.display = ''

  $('#generate-btn').style.display = 'none'
  const form = $('#form-profile')
  // Évite de recréer le formulaire s'il est déjà créé par react-snap (ou un autre outil de prerender)
  if (form.innerHTML !== '') {
    return
  }

  const appendToForm = appendTo(form)

  const formFirstPart = formProfileData
    .flat(1)
    .filter((field) => field.key !== 'reason')
    .filter((field) => !field.isHidden)
    .map((field, index) => {
      const formGroup = createFormGroup({
        autofocus: index === 0,
        ...field,
        name: field.key,
      })

      return formGroup
    })

  appendToForm([...formFirstPart])

  $('#save-profile-btn').addEventListener('click', async (event) => {
    event.preventDefault()

    const formInputs = $$('#form-profile input')
    saveProfile(formInputs)
  })
  $('#field-birthday').addEventListener('keyup', birthdayEventListener)
  $('#cancel-btn').addEventListener('click', async (event) => {
    event.preventDefault()

    const profiles = localStorage.getItem('PROFILES')
    if (!profiles || JSON.parse(profiles).length === 0 || profiles === null)
      return
    $('#field-birthday').removeEventListener('keyup', birthdayEventListener)
    toggleForm('attestation')
  })
}

export const saveProfile = (formInputs) => {
  const invalid = validateAriaFields(formProfileConditions)
  if (invalid) {
    return
  }
  const fields = {}
  for (const field of formInputs) {
    let value = field.value
    fields[field.id.substring('field-'.length)] = value
  }

  let profiles = []
  const profilesSerialized = localStorage.getItem('PROFILES')
  if (profilesSerialized !== null) {
    profiles = JSON.parse(profilesSerialized)
  }

  profiles.push(fields)

  localStorage.setItem('PROFILES', JSON.stringify(profiles))

  toggleForm('attestation')
}

/***
 *
 * switch between add profile form, and generate attestation form
 */
export const toggleForm = (destination) => {
  if (destination === 'attestation') {
    $('#form-profile').innerHTML = ''
    $('#profile-btn').style.display = 'none'
    $('#generate-btn').style.display = 'block'

    createFormAttestation()
    prepareForm()
  } else if (destination === 'profile') {
    $('#form-attestation').innerHTML = ''
    $('#generate-btn').removeEventListener('click', generateAttestationListener)
    $('#generate-btn').style.display = 'none'
    $('#profile-btn').style.display = 'block'

    createFormProfile()
    $('#my-profiles').innerHTML = ''
    createMyProfilesPage()
  }
}

export const createMyProfilesPage = () => {
  const h2 = createElement('h2', {
    className: 'titre-2',
    innerHTML: 'Mes profils: ',
  })
  const appendToMyProfilesPage = appendTo($('#my-profiles'))
  appendToMyProfilesPage(h2)
  const profiles = JSON.parse(localStorage.getItem('PROFILES'))
  for (let index in profiles) {
    const profile = profiles[index]
    const profileContainer = createElement('div', {
      className: 'profile-container',
    })
    const p = createElement('p', {
      innerHTML: `${profile.firstname} ${profile.address}`,
    })
    const btn = createElement('button', {
      innerHTML: `Supprimer`,
      value: index,
      className: 'btn btn-danger',
    })

    const appendToContainer = appendTo(profileContainer)
    appendToContainer(p)
    appendToContainer(btn)
    appendToMyProfilesPage(profileContainer)

    btn.addEventListener('click', function listener(event) {
      profiles.splice(index, 1)
      localStorage.setItem('PROFILES', JSON.stringify(profiles))

      $('#my-profiles').innerHTML = ''
      btn.removeEventListener('click', listener)
      createMyProfilesPage()
    })
  }
}

export const birthdayEventListener = (event) => {
  event.preventDefault()
  const input = event.target
  const key = event.keyCode || event.charCode
  if (key !== 8 && key !== 46) {
    input.value = addSlash(input.value)
  }
}
