import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Share2, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

const NODE_COLORS = {
  domain: '#3b82f6',
  ip: '#8b5cf6',
  registrar: '#f59e0b',
  brand: '#10b981',
  asn: '#ec4899',
};

const NODE_ICONS = {
  domain: '🌐', ip: '🖥️', registrar: '📋', brand: '🏷️', asn: '🔗',
};

function buildFlowData(graphData) {
  if (!graphData?.nodes?.length) return { nodes: [], edges: [] };

  const nodes = graphData.nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / graphData.nodes.length;
    const radius = 250 + (i % 3) * 80;
    return {
      id: n.id,
      position: { x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) },
      data: {
        label: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{NODE_ICONS[n.type] || '❓'}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{n.type}{n.risk_score > 0 ? ` · Risk ${n.risk_score}` : ''}</div>
          </div>
        ),
      },
      style: {
        background: '#1a1f35',
        border: `2px solid ${NODE_COLORS[n.type] || '#64748b'}`,
        borderRadius: 12,
        padding: '12px 8px',
        boxShadow: `0 0 15px ${NODE_COLORS[n.type] || '#64748b'}30`,
        minWidth: 130,
      },
    };
  });

  const edges = graphData.edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    label: e.relationship.replace(/_/g, ' '),
    animated: e.relationship === 'impersonates',
    style: { stroke: e.relationship === 'impersonates' ? '#ef4444' : '#64748b', strokeWidth: 1.5 },
    labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 },
    labelBgStyle: { fill: '#1a1f35', stroke: '#2a3050' },
    labelBgPadding: [4, 4],
    labelBgBorderRadius: 4,
  }));

  return { nodes, edges };
}

export default function ThreatGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getThreatGraph(domain);
      setGraphData(data);
      const flow = buildFlowData(data);
      setNodes(flow.nodes);
      setEdges(flow.edges);
    } catch (err) {
      console.error('Graph load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [domain, setNodes, setEdges]);

  useEffect(() => { loadGraph(); }, [loadGraph]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* ── Controls ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Filter by domain..."
            className="input-dark text-sm"
          />
        </div>
        <button onClick={loadGraph} className="btn-primary flex items-center gap-2 text-sm py-2 px-4" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
        <div className="flex items-center gap-4 ml-auto">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <Share2 size={14} style={{ color: 'var(--color-accent)' }} />
        <span>Nodes: <strong style={{ color: 'var(--color-text-secondary)' }}>{graphData?.total_nodes ?? 0}</strong></span>
        <span>Edges: <strong style={{ color: 'var(--color-text-secondary)' }}>{graphData?.total_edges ?? 0}</strong></span>
      </div>

      {/* ── Graph ── */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
            <Loader2 size={24} className="animate-spin mr-3" />
            Loading threat graph...
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
            <Share2 size={40} className="mb-4 opacity-30" />
            <p className="text-sm">No threat graph data yet</p>
            <p className="text-xs mt-1">Scan some URLs to populate the graph</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            attributionPosition="bottom-left"
          >
            <Background color="#2a3050" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const type = n.data?.label?.props?.children?.[2]?.props?.children?.[0];
                return NODE_COLORS[type] || '#64748b';
              }}
              maskColor="rgba(10,14,26,0.8)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
