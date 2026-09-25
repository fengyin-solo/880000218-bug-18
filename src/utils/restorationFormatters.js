export function riskMeta(risk) {
  const map = {
    high: {
      label: '高',
      tone: 'high',
    },
    medium: {
      label: '中',
      tone: 'medium',
    },
    low: {
      label: '低',
      tone: 'low',
    },
  }

  return map[risk] ?? map.low
}

export function stepStatusMeta(status) {
  const map = {
    active: {
      label: '进行中',
      tone: 'active',
    },
    pending: {
      label: '待处理',
      tone: 'pending',
    },
    done: {
      label: '已完成',
      tone: 'done',
    },
    cancelled: {
      label: '已取消',
      tone: 'cancelled',
    },
  }

  return map[status] ?? map.pending
}

export function formatMinutes(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const rest = String(minutes % 60).padStart(2, '0')
  return `${hours}:${rest}`
}

export function formatSlot(slot) {
  if (!slot) return '—'
  return `${formatMinutes(slot.start)} – ${formatMinutes(slot.end)}`
}
