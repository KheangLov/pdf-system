import { pdfjsLib } from './worker'
import type { DocumentPageMeta } from '@/types'

export interface LoadedPdf {
  pageCount: number
  pages: DocumentPageMeta[]
  document: import('pdfjs-dist').PDFDocumentProxy
}

export async function loadPdfFromData(data: ArrayBuffer): Promise<LoadedPdf> {
  /* pdf.js consumes the underlying buffer; clone first so the caller can reuse it. */
  const copy = data.slice(0)
  const task = pdfjsLib.getDocument({ data: copy })
  const pdf = await task.promise
  const pages: DocumentPageMeta[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1 })
    pages.push({
      index: i,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate
    })
  }
  return { pageCount: pdf.numPages, pages, document: pdf }
}

export async function renderPageToCanvas(
  pdf: import('pdfjs-dist').PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Could not acquire 2D context')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  canvas.style.width = `${viewport.width}px`
  canvas.style.height = `${viewport.height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
}

export async function renderThumbnail(
  pdf: import('pdfjs-dist').PDFDocumentProxy,
  pageNumber: number,
  maxWidth = 220
): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scale = maxWidth / base.width
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d', { alpha: false })!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas.toDataURL('image/png')
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer()
}
