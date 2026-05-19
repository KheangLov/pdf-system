/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?worker' {
  const WorkerCtor: { new (): Worker }
  export default WorkerCtor
}
