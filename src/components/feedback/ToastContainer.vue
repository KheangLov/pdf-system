<script setup lang="ts">
import { useUIStore } from '@/stores'
const ui = useUIStore()

const iconMap: Record<string, string> = {
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  info: 'mdi-information',
  warning: 'mdi-alert'
}
</script>

<template>
  <Teleport to="body">
    <div class="ws-toast-stack">
      <transition-group name="slide-up" tag="div">
        <div
          v-for="t in ui.toasts"
          :key="t.id"
          :class="['ws-toast', `is-${t.type}`]"
          role="status"
        >
          <v-icon :icon="iconMap[t.type]" size="20" />
          <span class="ws-toast-msg">{{ t.message }}</span>
          <button class="ws-toast-close" @click="ui.dismissToast(t.id)" aria-label="Dismiss">
            <v-icon icon="mdi-close" size="16" />
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.ws-toast-stack {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.ws-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  max-width: 420px;
  padding: 12px 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 12px;
  box-shadow: var(--ws-shadow-lg);
  font-size: 13.5px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));

  &.is-success { border-left: 3px solid rgb(var(--v-theme-success)); }
  &.is-error { border-left: 3px solid rgb(var(--v-theme-error)); }
  &.is-warning { border-left: 3px solid rgb(var(--v-theme-warning)); }
  &.is-info { border-left: 3px solid rgb(var(--v-theme-info)); }
}
.ws-toast-msg { flex: 1; }
.ws-toast-close {
  background: transparent;
  border: 0;
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  &:hover { background: rgb(var(--v-theme-surface-variant)); }
}
</style>
