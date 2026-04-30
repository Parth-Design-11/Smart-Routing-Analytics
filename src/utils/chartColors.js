export const PRIMARY_COLOR = '#375DFB'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function adjustOpacity(color, opacity) {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
}

export const channelColors = {
  sms: PRIMARY_COLOR,
  rcs: adjustOpacity(PRIMARY_COLOR, 0.8),
  tc: adjustOpacity(PRIMARY_COLOR, 0.6),
}

export const monochromeScale = [
  PRIMARY_COLOR,
  adjustOpacity(PRIMARY_COLOR, 0.86),
  adjustOpacity(PRIMARY_COLOR, 0.72),
  adjustOpacity(PRIMARY_COLOR, 0.58),
  adjustOpacity(PRIMARY_COLOR, 0.44),
  adjustOpacity(PRIMARY_COLOR, 0.3),
]

export const routeTypeColors = {
  sms: PRIMARY_COLOR,
  'rcs+sms': adjustOpacity(PRIMARY_COLOR, 0.8),
  'tc+sms': adjustOpacity(PRIMARY_COLOR, 0.6),
  multi: adjustOpacity(PRIMARY_COLOR, 0.4),
}

export const funnelColors = [
  ...monochromeScale.slice(0, 5),
]

export const failureBarColors = {
  primary: PRIMARY_COLOR,
  secondary: adjustOpacity(PRIMARY_COLOR, 0.6),
}

export const heatmapGradient = [
  [0, adjustOpacity(PRIMARY_COLOR, 0.25)],
  [0.33, adjustOpacity(PRIMARY_COLOR, 0.5)],
  [0.67, adjustOpacity(PRIMARY_COLOR, 0.75)],
  [1, PRIMARY_COLOR],
]

export default {
  channelColors,
  routeTypeColors,
  funnelColors,
  failureBarColors,
  heatmapGradient,
  monochromeScale,
  PRIMARY_COLOR,
}
