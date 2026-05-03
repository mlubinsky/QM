import _Plot from 'react-plotly.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot

interface OrbitalIsosurfaceProps {
  isoAxis: number[]
  isoValues: number[]
  orbitalLabel: string
}

export function OrbitalIsosurface({ isoAxis, isoValues, orbitalLabel }: OrbitalIsosurfaceProps) {
  const N = isoAxis.length
  if (N === 0 || isoValues.length !== N ** 3) return null

  // Expand 1-D axis into flat coordinate arrays for Plotly isosurface
  const x: number[] = new Array(N ** 3)
  const y: number[] = new Array(N ** 3)
  const z: number[] = new Array(N ** 3)
  let idx = 0
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      for (let k = 0; k < N; k++) {
        x[idx] = isoAxis[i]
        y[idx] = isoAxis[j]
        z[idx] = isoAxis[k]
        idx++
      }

  const maxVal = Math.max(...isoValues)
  const isoLevel = maxVal * 0.1   // 10 % of peak — shows the orbital envelope

  const trace = {
    type: 'isosurface' as const,
    x, y, z,
    value: isoValues,
    isomin: isoLevel,
    isomax: maxVal,
    surface: { count: 1 },
    colorscale: 'Viridis',
    opacity: 0.6,
    showscale: false,
    caps: { x: { show: false }, y: { show: false }, z: { show: false } },
  }

  const layout: Partial<Plotly.Layout> = {
    title: { text: `|ψ<sub>${orbitalLabel}</sub>(x,y,z)|² isosurface (10 % of peak)` },
    autosize: true,
    margin: { t: 40, b: 0, l: 0, r: 0 },
    scene: {
      xaxis: { title: { text: 'x (a.u.)' } },
      yaxis: { title: { text: 'y (a.u.)' } },
      zaxis: { title: { text: 'z (a.u.)' } },
      aspectmode: 'cube',
    },
  }

  return (
    <Plot
      data-testid="orbital-isosurface"
      data={[trace]}
      layout={layout}
      style={{ width: '100%', height: '420px' }}
      useResizeHandler
    />
  )
}
