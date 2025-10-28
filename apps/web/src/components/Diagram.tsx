import { layout as dagreLayout, graphlib } from '@dagrejs/dagre'
import { useMemo } from 'react'
import type { DiagramData } from '../types'

interface DiagramProps {
  data: DiagramData
}

export function Diagram({ data }: DiagramProps) {
  const { nodes, height, width, edgePaths } = useMemo(() => {
    // Handle empty diagram case
    if (data.nodes.length === 0) {
      return {
        nodes: [],
        edges: [],
        width: 800,
        height: 600,
        edgePaths: [],
      }
    }

    const g = new graphlib.Graph()
      .setGraph({
        rankdir: 'TB', // Always top to bottom
        nodesep: 50,
        ranksep: 70,
        marginx: 20,
        marginy: 20,
      })
      .setDefaultEdgeLabel(() => ({}))

    for (const n of data.nodes) {
      // Calculate height based on whether there's a translation
      const nodeHeight = n.translation ? 60 : 44

      // Calculate width dynamically based on text length
      // Use the longer of label or translation for width calculation
      const textForWidth =
        n.translation && n.translation.length > n.label.length
          ? n.translation
          : n.label

      // Approximate width: ~12px per character at 24px font size, with min 100px and padding
      const calculatedWidth = Math.max(
        100,
        Math.min(400, textForWidth.length * 12 + 40) // 40px for padding
      )

      g.setNode(n.id, {
        label: n.label,
        translation: n.translation,
        width: n.width ?? calculatedWidth,
        height: nodeHeight,
      })
    }

    // Create a set of valid node IDs for quick lookup
    const validNodeIds = new Set(data.nodes.map(n => n.id))

    // Only add edges where both nodes exist
    for (const [i, e] of data.edges.entries()) {
      if (validNodeIds.has(e.from) && validNodeIds.has(e.to)) {
        g.setEdge(e.from, e.to, { id: e.id ?? `e${i}` })
      } else {
        console.warn(
          `⚠️ Skipping edge from "${e.from}" to "${e.to}" - one or both nodes don't exist`
        )
      }
    }

    dagreLayout(g)

    const nodes = g.nodes().map(id => {
      const n = g.node(id)
      return { id, ...n } as {
        id: string
        x: number
        y: number
        width: number
        height: number
        label: string
        translation?: string
      }
    })

    const edgePaths = g.edges().map(e => {
      const edge = g.edge(e)
      const d = edge.points
        .map((p: { x: number; y: number }, i: number) =>
          i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        )
        .join(' ')
      return { id: edge.id ?? `${e.v}-${e.w}`, d }
    })

    return {
      nodes,
      edges: g.edges(),
      width: Math.ceil(g.graph().width || 800),
      height: Math.ceil(g.graph().height || 600),
      edgePaths,
    }
  }, [data])

  if (nodes.length === 0) {
    return (
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white dark:bg-gray-900 transition-colors duration-300"
      >
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-400 dark:fill-gray-500 transition-colors duration-300"
          style={{ font: '14px system-ui' }}
        >
          No nodes yet
        </text>
      </svg>
    )
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="bg-white dark:bg-gray-900 transition-colors duration-300"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          className="fill-gray-600 dark:fill-gray-300"
        >
          <path d="M0,0 L10,3 L0,6 Z" />
        </marker>
      </defs>

      {edgePaths.map(e => (
        <path
          key={e.id}
          d={e.d}
          fill="none"
          className="stroke-gray-600 dark:stroke-gray-300 transition-colors duration-300"
          strokeWidth={3}
          markerEnd="url(#arrow)"
        />
      ))}

      {nodes.map(n => {
        const hasTranslation = Boolean(n.translation)
        return (
          <g
            key={n.id}
            transform={`translate(${n.x - n.width / 2}, ${n.y - n.height / 2})`}
          >
            <rect
              width={n.width}
              height={n.height}
              rx={8}
              ry={8}
              className="fill-white dark:fill-gray-800 stroke-gray-600 dark:stroke-gray-300 transition-colors duration-300"
            />
            {hasTranslation ? (
              <>
                {/* Original text on top */}
                <text
                  x={n.width / 2}
                  y={n.height / 2 - 10}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="fill-gray-900 dark:fill-gray-100 transition-colors duration-300"
                  style={{ font: '24px system-ui', fontWeight: 600 }}
                >
                  {n.label}
                </text>
                {/* Translation on bottom */}
                <text
                  x={n.width / 2}
                  y={n.height / 2 + 10}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-400 transition-colors duration-300"
                  style={{ font: '20px system-ui' }}
                >
                  {n.translation}
                </text>
              </>
            ) : (
              /* Single line text */
              <text
                x={n.width / 2}
                y={n.height / 2}
                dominantBaseline="middle"
                textAnchor="middle"
                className="fill-gray-900 dark:fill-gray-100 transition-colors duration-300"
                style={{ font: '24px system-ui' }}
              >
                {n.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
