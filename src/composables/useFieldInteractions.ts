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

const GRID_DIVISIONS = 200

export function useFieldInteractions(target: Ref<HTMLElement | null>, opts: Options) {
  const editor = useEditorStore()
  const ui = useUIStore()

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
  const snapVal = (v: number) => Math.round(v * GRID_DIVISIONS) / GRID_DIVISIONS

  function snap(id: string) {
    if (!ui.preferences.snapToGrid) return
    const f = editor.fields.find((x) => x.id === id)
    if (!f) return
    editor.updatePosition(id, {
      x: snapVal(f.position.x),
      y: snapVal(f.position.y),
      width: snapVal(f.position.width),
      height: snapVal(f.position.height)
    })
  }

  function setup() {
    const el = target.value
    if (!el) return
    const interactable = interact(el)

    interactable
      .draggable({
        inertia: false,
        modifiers: [interact.modifiers.restrictRect({ restriction: 'parent' })],
        listeners: {
          start: () => {
            if (opts.field.locked) return false
            if (!editor.selectedIds.has(opts.field.id)) editor.selectField(opts.field.id)
          },
          move: (event) => {
            if (opts.field.locked) return
            const dx = event.dx / opts.pageWidth.value
            const dy = event.dy / opts.pageHeight.value
            const f = editor.fields.find((x) => x.id === opts.field.id)
            if (!f) return
            editor.updatePosition(opts.field.id, {
              x: clamp(f.position.x + dx, 0, 1 - f.position.width),
              y: clamp(f.position.y + dy, 0, 1 - f.position.height)
            })
          },
          end: () => {
            snap(opts.field.id)
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
          move: (event) => {
            if (opts.field.locked) return
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
          end: () => {
            snap(opts.field.id)
            editor.commitUpdate('Resized field')
          }
        }
      })
  }

  function tearDown() {
    const el = target.value
    if (!el) return
    try { interact(el).unset() } catch { /* noop */ }
  }

  onMounted(setup)
  onBeforeUnmount(tearDown)
  watch(target, (n, o) => { if (n !== o) { tearDown(); setup() } })
}
