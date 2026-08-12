// Curva da banca ao longo do recorte. Normaliza os valores no próprio viewBox em vez de
// usar escala fixa — o interesse é a forma do movimento, não a magnitude absoluta.
// Cor segue o resultado do período: verde se terminou acima, carmim se abaixo.

const WIDTH = 320
const HEIGHT = 72
const TOP = 8
const BOTTOM = 58

export function StackSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const isUp = values[values.length - 1] >= values[0]
  const stroke = isUp ? '#3FCF8E' : '#E0313E'

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * WIDTH
    const y = BOTTOM - ((value - min) / range) * (BOTTOM - TOP)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const line = `M${points.join(' L')}`

  return (
    <svg
      width="100%"
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#sparkFade)" />
      <path
        d={line}
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}