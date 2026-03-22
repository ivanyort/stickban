import './styles.css'
import logoUrl from '../logos/logo001.png'

const logo = document.getElementById('brand-mark')

if (logo instanceof HTMLImageElement) {
  logo.src = logoUrl
}
