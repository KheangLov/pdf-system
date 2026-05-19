import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { saveAs } from 'file-saver'
import type { SignDocument, SignField } from '@/types'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const v = clean.length === 3
    ? clean.split('').map((c) => parseInt(c + c, 16))
    : [clean.slice(0, 2), clean.slice(2, 4), clean.slice(4, 6)].map((c) => parseInt(c, 16))
  return { r: (v[0] ?? 0) / 255, g: (v[1] ?? 0) / 255, b: (v[2] ?? 0) / 255 }
}

async function embedImageFromDataUrl(pdf: PDFDocument, dataUrl: string) {
  if (dataUrl.startsWith('data:image/png')) return pdf.embedPng(dataUrl)
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return pdf.embedJpg(dataUrl)
  return pdf.embedPng(dataUrl)
}

export async function exportSignedPdf(doc: SignDocument): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(doc.pdfData.slice(0))
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  for (const field of doc.fields) {
    const page = pages[field.position.page - 1]
    if (!page) continue
    const { width: pw, height: ph } = page.getSize()
    const x = field.position.x * pw
    const w = field.position.width * pw
    const h = field.position.height * ph
    const y = ph - (field.position.y * ph) - h
    const color = hexToRgb(field.style?.color ?? '#0f172a')

    switch (field.type) {
      case 'signature':
      case 'initial': {
        if (typeof field.value === 'string' && field.value.startsWith('data:image')) {
          try {
            const img = await embedImageFromDataUrl(pdfDoc, field.value)
            const scale = Math.min(w / img.width, h / img.height)
            const drawW = img.width * scale
            const drawH = img.height * scale
            page.drawImage(img, {
              x: x + (w - drawW) / 2,
              y: y + (h - drawH) / 2,
              width: drawW,
              height: drawH
            })
          } catch { /* skip malformed image */ }
        } else if (typeof field.value === 'string' && field.value) {
          const fontSize = Math.min(h * 0.7, w / Math.max(1, field.value.length) * 1.4)
          page.drawText(field.value, {
            x, y: y + h * 0.2, size: fontSize, font: helveticaBold,
            color: rgb(color.r, color.g, color.b)
          })
        }
        break
      }
      case 'checkbox': {
        const checked = field.value === true
        const size = Math.min(w, h)
        page.drawRectangle({
          x, y, width: size, height: size,
          borderColor: rgb(color.r, color.g, color.b),
          borderWidth: 1
        })
        if (checked) {
          page.drawText('X', {
            x: x + size * 0.2, y: y + size * 0.2,
            size: size * 0.7, font: helveticaBold,
            color: rgb(color.r, color.g, color.b)
          })
        }
        break
      }
      default: {
        const text = String(field.value ?? '')
        if (!text) break
        const fontSize = field.style?.fontSize ?? Math.max(10, Math.min(h * 0.55, 14))
        const font = field.style?.fontWeight === 'bold' ? helveticaBold : helvetica
        const lines = text.split('\n')
        let cursorY = y + h - fontSize
        for (const line of lines) {
          if (cursorY < y) break
          page.drawText(line, {
            x: x + 2, y: cursorY, size: fontSize, font,
            color: rgb(color.r, color.g, color.b),
            maxWidth: w - 4
          })
          cursorY -= fontSize * 1.2
        }
      }
    }
  }

  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

export async function downloadSignedPdf(doc: SignDocument, filename?: string): Promise<void> {
  const blob = await exportSignedPdf(doc)
  saveAs(blob, filename ?? doc.name.replace(/\.pdf$/i, '') + '-signed.pdf')
}
