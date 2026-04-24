<script setup>
const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, align?, width? }]
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
})
defineEmits(['row-click'])
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-body">
      <thead>
        <tr class="border-b border-surface-border bg-surface-muted">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left text-caption font-medium uppercase tracking-wide text-ink-muted"
            :class="[col.align === 'right' && 'text-right', col.align === 'center' && 'text-center']"
            :style="col.width ? { width: col.width } : {}"
          >
            <slot :name="`header-${col.key}`" :col="col">{{ col.label }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row[rowKey]"
          class="border-b border-surface-border transition-colors hover:bg-surface-muted"
          @click="$emit('row-click', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-4 align-middle"
            :class="[col.align === 'right' && 'text-right', col.align === 'center' && 'text-center']"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
