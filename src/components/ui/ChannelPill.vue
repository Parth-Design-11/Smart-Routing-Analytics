<script setup>
const props = defineProps({
  channel: { type: String, required: true }, // 'sms' | 'rcs' | 'tc' | 'viber'
})

const meta = {
  sms: { label: 'SMS', bg: 'bg-[#e0edff]', dot: 'bg-channel-sms', text: 'text-[#0a4bb8]' },
  rcs: { label: 'RCS', bg: 'bg-[#ede3ff]', dot: 'bg-channel-rcs', text: 'text-[#4b1fa3]' },
  tc: { label: 'TC', bg: 'bg-[#def7e7]', dot: 'bg-channel-tc', text: 'text-[#0e7a45]' },
  viber: { label: 'Viber', bg: 'bg-[#f1e5ff]', dot: 'bg-channel-viber', text: 'text-[#5a1fa8]' },
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-caption font-medium"
    :class="[meta[channel]?.bg, meta[channel]?.text]"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="meta[channel]?.dot" />
    {{ meta[channel]?.label || channel.toUpperCase() }}
  </span>
</template>
