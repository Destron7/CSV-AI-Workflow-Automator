import React from 'react'
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from 'dagre'

export const FlowDAG = ({ learned, treatmentColumn, outcomeColumn }) => {
    const t = treatmentColumn
    const y = outcomeColumn
    const instanceRef = React.useRef(null)

    // Build a union of directed and undirected (skeleton) edges so we don't hide non-oriented links
    const { allEdges, directedSet } = React.useMemo(() => {
        const skeleton = (learned?.edges || []).filter(e => e && e.source && e.target)
        const directed = (learned?.edges_directed || []).filter(e => e && e.source && e.target)
        // Use a set to track directed pairs for styling and to avoid duplicates
        const dset = new Set(directed.map(e => `${e.source}||${e.target}`))
        // Merge, avoiding duplicates
        const merged = [...directed]
        for (const e of skeleton) {
            const k1 = `${e.source}||${e.target}`
            const k2 = `${e.target}||${e.source}` // handle possible opposite orientation in skeleton
            if (!dset.has(k1) && !dset.has(k2)) merged.push(e)
        }
        return { allEdges: merged, directedSet: dset }
    }, [learned])

    // Dagre layout (left-to-right)
    const baseNodes = React.useMemo(() => {
        const g = new dagre.graphlib.Graph()
        g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 60 })
        g.setDefaultEdgeLabel(() => ({}))

        const nodes = (learned?.nodes || []).map((id) => {
            const isT = id === t
            const isY = id === y
            const color = isT ? '#f97316' : isY ? '#22c55e' : '#60a5fa'
            return { id, width: 120, height: 40, style: { background: color, color: '#fff', border: '1px solid #1f2937', borderRadius: 8, padding: 6 } }
        })
        nodes.forEach((n) => g.setNode(n.id, { width: n.width, height: n.height }))
        allEdges.forEach((e) => g.setEdge(e.source, e.target))
        dagre.layout(g)
        return nodes.map((n) => {
            const p = g.node(n.id) || { x: 0, y: 0 }
            return { id: n.id, data: { label: n.id, title: n.id }, position: { x: p.x - (n.width / 2), y: p.y - (n.height / 2) }, style: n.style }
        })
    }, [learned?.nodes, allEdges, t, y])

    const baseEdges = React.useMemo(() => {
        return allEdges.map((e, i) => {
            const key = `${e.source}-${e.target}-${i}`
            const isDirected = directedSet.has(`${e.source}||${e.target}`)
            return {
                id: key,
                source: e.source,
                target: e.target,
                type: 'smoothstep',
                label: isDirected ? `${e.source} → ${e.target}` : `${e.source} — ${e.target}`,
                markerEnd: isDirected ? { type: MarkerType.ArrowClosed, color: '#374151' } : undefined,
                style: isDirected
                    ? { stroke: '#374151', strokeWidth: 2 }
                    : { stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '6 4' },
            }
        })
    }, [allEdges, directedSet])

    const [nodes, , onNodesChange] = useNodesState(baseNodes)
    const [edges, , onEdgesChange] = useEdgesState(baseEdges)

    // Fit view when graph changes
    React.useEffect(() => {
        const t = setTimeout(() => {
            try { instanceRef.current && instanceRef.current.fitView({ padding: 0.15 }) } catch { }
        }, 50)
        return () => clearTimeout(t)
    }, [nodes.length, edges.length])

    if (!learned) {
        return (
            <div className="w-full h-[420px] flex items-center justify-center text-sm text-gray-600">
                No graph to display.
            </div>
        )
    }

    return (
        <div style={{ width: '100%', height: 420, position: 'relative' }}>
            {/* Legend */}
            <div className="absolute z-10 right-2 top-2 bg-white/90 border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 shadow-sm">
                <span className="inline-flex items-center mr-2"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#f97316' }} />Treatment</span>
                <span className="inline-flex items-center mr-2"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#22c55e' }} />Outcome</span>
                <span className="inline-flex items-center"><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#60a5fa' }} />Other</span>
            </div>
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onInit={(inst) => { instanceRef.current = inst; try { inst.fitView({ padding: 0.15 }) } catch { } }}
                    fitView
                >
                    <MiniMap nodeColor={(n) => n.style?.background || '#93c5fd'} zoomable pannable />
                    <Controls />
                    <Background variant="dots" gap={14} size={1} />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    )
}
