/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INVENTORY_API?: string
  readonly VITE_PAYMENT_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
