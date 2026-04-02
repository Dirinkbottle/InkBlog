import React, { useMemo } from 'react'

const VIEWBOX_WIDTH = 240
const VIEWBOX_HEIGHT = 96
const PADDING_X = 10
const PADDING_Y = 8

function buildLinePath(values) {
  const drawableWidth = VIEWBOX_WIDTH - PADDING_X * 2
  const drawableHeight = VIEWBOX_HEIGHT - PADDING_Y * 2
  const maxValue = Math.max(...values, 1)
  const step = values.length > 1 ? drawableWidth / (values.length - 1) : drawableWidth

  return values
    .map((value, index) => {
      const x = PADDING_X + step * index
      const y = PADDING_Y + drawableHeight - (value / maxValue) * drawableHeight
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

export default function MiniTrendChart({ points = [], mode = 'line', accent = '#111827', label = 'trend' }) {
  const values = useMemo(() => points.map((point) => Number(point.value) || 0), [points])

  if (values.length === 0) {
    return (
      <div className="h-24 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center text-xs text-zinc-400">
        暂无趋势数据
      </div>
    )
  }

  const maxValue = Math.max(...values, 1)
  const barWidth = (VIEWBOX_WIDTH - PADDING_X * 2) / values.length
  const linePath = buildLinePath(values)
  const modeLabel = mode === 'bar' ? '柱状图' : '折线图'
  const chartSummary = `${label} ${modeLabel}，共 ${values.length} 个数据点`

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      className="h-24 w-full"
      role="img"
      aria-label={chartSummary}
    >
      <title>{chartSummary}</title>
      <desc>{`最大值 ${maxValue}，以最近到更早顺序展示趋势。`}</desc>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={PADDING_X}
          y1={PADDING_Y + (VIEWBOX_HEIGHT - PADDING_Y * 2) * ratio}
          x2={VIEWBOX_WIDTH - PADDING_X}
          y2={PADDING_Y + (VIEWBOX_HEIGHT - PADDING_Y * 2) * ratio}
          stroke="#e4e4e7"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      ))}

      {mode === 'bar' ? (
        values.map((value, index) => {
          const height = ((VIEWBOX_HEIGHT - PADDING_Y * 2) * value) / maxValue
          const x = PADDING_X + index * barWidth + 3
          const y = VIEWBOX_HEIGHT - PADDING_Y - height
          const width = Math.max(barWidth - 6, 4)
          return (
            <rect
              key={`${index}-${value}`}
              x={x}
              y={y}
              width={width}
              height={Math.max(height, 2)}
              rx="4"
              fill={accent}
              opacity={0.9}
            />
          )
        })
      ) : (
        <>
          <path
            d={`${linePath} L ${VIEWBOX_WIDTH - PADDING_X} ${VIEWBOX_HEIGHT - PADDING_Y} L ${PADDING_X} ${VIEWBOX_HEIGHT - PADDING_Y} Z`}
            fill={accent}
            opacity="0.08"
          />
          <path
            d={linePath}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {values.map((value, index) => {
            const drawableWidth = VIEWBOX_WIDTH - PADDING_X * 2
            const drawableHeight = VIEWBOX_HEIGHT - PADDING_Y * 2
            const step = values.length > 1 ? drawableWidth / (values.length - 1) : drawableWidth
            const x = PADDING_X + step * index
            const y = PADDING_Y + drawableHeight - (value / maxValue) * drawableHeight
            return <circle key={`${index}-${value}`} cx={x} cy={y} r="3.5" fill={accent} />
          })}
        </>
      )}
    </svg>
  )
}
