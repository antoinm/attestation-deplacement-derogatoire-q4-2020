import 'bootstrap/dist/css/bootstrap.min.css'

import '../css/main.css'

import './icons'
import './check-updates'
import { prepareForm } from './form-util'
import { warnFacebookBrowserUserIfNecessary } from './facebook-util'
import {
  createFormAttestation,
  createFormProfile,
  createMyProfilesPage,
} from './form'

const profiles = localStorage.getItem('PROFILES')

warnFacebookBrowserUserIfNecessary()

createMyProfilesPage()

console.log('hola', JSON.parse(profiles))
if (!profiles || JSON.parse(profiles).length === 0 || profiles === null) {
  createFormProfile()
} else {
  createFormAttestation()
  prepareForm()
}
