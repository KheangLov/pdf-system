import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

let initialised = false

export function initPdfWorker() {
  if (initialised) return
  pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()
  initialised = true
}

export { pdfjsLib }
