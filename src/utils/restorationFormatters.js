export function formatMinutes(minutes) {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hours = String(Math.floor(safe / 60)).padStart(2, '0')
  const mins = String(safe % 60).padStart(2, '0')
  return `${hours}:${mins}`
}

export function stepStatusMeta(status) {
  const map = {
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
