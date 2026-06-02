import { onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import interact from 'interactjs'
import { useEditorStore } from '@/stores/editor'
import { useUIStore } from '@/stores/ui'
import type { SignField } from '@/types'

interface Options {
  field: SignField
  pageWidth: Ref<number>
  pageHeight: Ref<number>
}

/* Page is divided into 200 snap divisions — coarse enough to feel deliberate
 * (~3px on a typical A4 render at 1× zoom), fine enough to align cleanly. */
const GRID_DIVISIONS = 200

/* Don't kick off a drag for tiny accidental movements after click. */
const DRAG_THRESHOLD_PX = 3

export function useFieldInteractions(target: Ref<HTMLElement | null>, opts: Options) {
  const editor = useEditorStore()
  const ui = useUIStore()

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const snap = (v: number) => Math.round(v * GRID_DIVISIONS) / GRID_DIVISIONS

  function setup() {
    const el = target.value
    if (!el) return
    if (editor.mode === 'preview') return
    const interactable = interact(el)

    /* Running pixel delta for the active drag — accumulated locally so the
     * field follows the cursor at native pointer speed, then converted to
     * normalised page-relative deltas and committed via moveSelection.
     * On end, optionally snap-align everything in the selection. */
    let accumDxPx = 0
    let accumDyPx = 0
    let dragging = false

    interactable
      .draggable({
        inertia: false,
        autoScroll: true,
        modifiers: [
          /* Manual clamping in moveSelection — interact's restrictRect uses
           * pixel rects which fights the multi-field group translate. */
        ],
        listeners: {
          start: (event) => {
            if (opts.field.locked || editor.mode === 'preview') return false
            accumDxPx = 0
            accumDyPx = 0
            dragging = false
            event.target.classList.add('is-pre-drag')
          },
          move: (event) => {
            if (opts.field.locked || editor.mode === 'preview') return
            accumDxPx += event.dx
            accumDyPx += event.dy

            /* Apply threshold once, then promote to a real drag and select. */
            if (!dragging) {
              if (Math.hypot(accumDxPx, accumDyPx) < DRAG_THRESHOLD_PX) return
              dragging = true
              if (!editor.selectedIds.has(opts.field.id)) {
                editor.selectField(opts.field.id)
              }
              editor.draggingId = opts.field.id
              event.target.classList.remove('is-pre-drag')
              event.target.classList.add('is-dragging')
            }

            const dx = event.dx / opts.pageWidth.value
            const dy = event.dy / opts.pageHeight.value
            editor.moveSelection(opts.field.id, dx, dy)
          },
          end: (event) => {
            event.target.classList.remove('is-pre-drag', 'is-dragging')
            if (!dragging) return /* never moved past threshold — treat as click */
            editor.draggingId = null

            /* Snap-on-release: align every selected field to the grid in a
             * single atomic update so they don't drift apart. */
            if (ui.preferences.snapToGrid) {
              snapSelectionToGrid()
            }
            editor.commitUpdate('Moved field')
          }
        }
      })
      .resizable({
        edges: { left: true, right: true, top: true, bottom: true },
        modifiers: [
          interact.modifiers.restrictEdges({ outer: 'parent' }),
          interact.modifiers.restrictSize({ min: { width: 24, height: 16 } })
        ],
        listeners: {
          start: (event) => {
            event.target.classList.add('is-dragging')
          },
          move: (event) => {
            if (opts.field.locked || editor.mode === 'preview') return
            const f = editor.fields.find((x) => x.id === opts.field.id)
            if (!f) return
            const newW = event.rect.width / opts.pageWidth.value
            const newH = event.rect.height / opts.pageHeight.value
            const newX = f.position.x + event.deltaRect.left / opts.pageWidth.value
            const newY = f.position.y + event.deltaRect.top / opts.pageHeight.value
            editor.updatePosition(opts.field.id, {
              x: clamp(newX, 0, 1 - newW),
              y: clamp(newY, 0, 1 - newH),
              width: clamp(newW, 0.01, 1),
              height: clamp(newH, 0.01, 1)
            })
          },
          end: (event) => {
            event.target.classList.remove('is-dragging')
            if (ui.preferences.snapToGrid) snapSelectionToGrid()
            editor.commitUpdate('Resized field')
          }
        }
      })
  }

  function snapSelectionToGrid() {
    const ids = editor.selectedIds.has(opts.field.id)
      ? new Set(editor.selectedIds)
      : new Set([opts.field.id])
    for (const f of editor.fields) {
      if (!ids.has(f.id)) continue
      editor.updatePosition(f.id, {
        x: snap(f.position.x),
        y: snap(f.position.y),
        width: snap(f.position.width),
        height: snap(f.position.height)
      })
    }
  }

  function tearDown() {
    const el = target.value
    if (!el) return
    try { interact(el).unset() } catch { /* noop */ }
  }

  onMounted(setup)
  onBeforeUnmount(tearDown)
  watch(target, (n, o) => { if (n !== o) { tearDown(); setup() } })
  watch(() => editor.mode, () => { tearDown(); setup() })
}
