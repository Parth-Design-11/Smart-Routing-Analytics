<script setup>
import { computed } from 'vue'
import ChannelPill from './ChannelPill.vue'
import iconSms from '../../../icons/SMS.png'
import iconTruecaller from '../../../icons/Truecaller.png'
import iconRcs from '../../../icons/Google RCS.png'

const props = defineProps({
  channels: { type: Array, required: true }, // array of channel ids
})

const CHANNEL_ICON = {
  sms: iconSms,
  rcs: iconRcs,
  tc: iconTruecaller,
}

const CHANNEL_TITLE = {
  sms: 'SMS',
  rcs: 'RCS',
  tc: 'Truecaller',
  viber: 'Viber',
}

const showPillOnly = computed(
  () => props.channels.length === 1 && !CHANNEL_ICON[props.channels[0]],
)

const channelsHoverText = computed(() =>
  props.channels.map((c) => CHANNEL_TITLE[c] ?? String(c).toUpperCase()).join(', '),
)

function iconFor(c) {
  return CHANNEL_ICON[c] ?? null
}
</script>

<template>
  <div class="flex items-center gap-1" :title="channelsHoverText">
    <ChannelPill v-if="showPillOnly" :channel="channels[0]" />
    <span
      v-else
      class="inline-flex items-center gap-0.5 rounded-full border border-surface-border bg-surface px-1.5 py-0.5"
    >
      <span
        v-for="c in channels"
        :key="c"
        class="relative h-4 w-4 shrink-0 overflow-hidden rounded-full ring-2 ring-surface"
      >
        <img
          v-if="iconFor(c)"
          :src="iconFor(c)"
          :alt="CHANNEL_TITLE[c] || c"
          class="h-full w-full object-cover"
        />
        <span
          v-else
          class="block h-full w-full rounded-full"
          :class="c === 'viber' ? 'bg-channel-viber' : 'bg-ink-muted/35'"
        />
      </span>
    </span>
  </div>
</template>
