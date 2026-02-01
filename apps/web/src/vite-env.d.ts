/// <reference types="vite/client" />

/**
 * Khai báo các biến môi trường cho Vite
 * Được sử dụng trong quá trình build và runtime
 */
interface ImportMetaEnv {
  /** URL của API backend (ví dụ: https://api.example.com/api) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
