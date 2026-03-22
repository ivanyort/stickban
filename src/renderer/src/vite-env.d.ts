/// <reference types="vite/client" />

import type { StickbanApi } from '@shared/types'

declare global {
  interface Window {
    stickban: StickbanApi
  }
}
