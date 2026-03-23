import './styles.css'
import logoUrl from '../logos/ico_kit/Web/android-chrome-192x192.png'

const logo = document.getElementById('brand-mark')

if (logo instanceof HTMLImageElement) {
  logo.src = logoUrl
}
