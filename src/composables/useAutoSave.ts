import { watch } from 'vue'
import { debounce } from 'lodash-es'

export function useAutoSave<T>(source: () => T, fn: () => void | Promise<void>, delay = 1200) {
  const debounced = debounce(fn, delay)
  watch(source, () => { debounced() }, { deep: true })
}
