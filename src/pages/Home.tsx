import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, LogOut, Pencil, MoreHorizontal } from 'lucide-react'
import { exportToSvg } from '@excalidraw/excalidraw'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Workspace, DiagramFile } from '../types'

function DiagramPreview({ elements, appState }: { elements: any[]; appState: Record<string, any> }) {
  const [svgUrl, setSvgUrl] = useState<string | null>(null)
  const isEmpty = !elements || elements.length === 0

  useEffect(() => {
    if (isEmpty) return
    let cancelled = false
    exportToSvg({ elements, appState, files: null } as any).then((svg: SVGSVGElement) => {
      if (cancelled) return
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      setSvgUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [elements, isEmpty])

  if (isEmpty || !svgUrl) {
    return (
      <div style={{ height: 112, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M6 34 L16 10 L26 24 L32 16 L39 28" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          <rect x="8" y="26" width="13" height="9" rx="3" stroke="#a78bfa" strokeWidth="1.5" fill="none" opacity="0.5"/>
          <rect x="26" y="18" width="11" height="11" rx="3" stroke="#c084fc" strokeWidth="1.5" fill="none" opacity="0.5"/>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ height: 112, background: '#fafafa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
      <img src={svgUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

function InlineInput({ value, onConfirm, onCancel }: {
  value: string; onConfirm: (v: string) => void; onCancel: () => void
}) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <input
      ref={ref}
      style={{ padding: '2px 8px', border: '1.5px solid #7c3aed', borderRadius: 6, outline: 'none', fontSize: 14, fontWeight: 600, color: '#111', background: '#fff', width: '100%' }}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onConfirm(val.trim() || value); if (e.key === 'Escape') onCancel() }}
      onBlur={() => onConfirm(val.trim() || value)}
    />
  )
}

function FileCard({ file, onNavigate, onRename, onDelete }: {
  file: DiagramFile; onNavigate: () => void; onRename: (n: string) => void; onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => { if (!editing && !menuOpen) onNavigate() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#c4b5fd' : '#f0f0f0'}`,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
    >
      {/* Preview */}
      <DiagramPreview elements={file.elements} appState={file.appState} />

      {/* Info */}
      <div style={{ padding: '10px 14px 12px' }}>
        {editing ? (
          <div onClick={e => e.stopPropagation()}>
            <InlineInput
              value={file.name}
              onConfirm={v => { onRename(v); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </p>
            <p style={{ fontSize: 11, color: '#aaa', margin: '3px 0 0' }}>
              Edited {timeAgo(file.updatedAt)}
            </p>
          </>
        )}
      </div>

      {/* Menu */}
      {!editing && hovered && (
        <div style={{ position: 'absolute', top: 8, right: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e5e5', borderRadius: 8, cursor: 'pointer', color: '#666' }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: 32, zIndex: 20, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: 140, overflow: 'hidden' }}>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', fontSize: 13, color: '#333', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => { setEditing(true); setMenuOpen(false) }}
                >
                  <Pencil size={13} color="#888" /> Rename
                </button>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => { if (confirm(`Delete "${file.name}"?`)) onDelete(); setMenuOpen(false) }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function WorkspaceSection({ workspace, canDelete }: { workspace: Workspace; canDelete: boolean }) {
  const navigate = useNavigate()
  const { renameWorkspace, deleteWorkspace, createFile, renameFile, deleteFile } = useAppStore()
  const [editingWs, setEditingWs] = useState(false)

  function handleNewFile() {
    const fileId = createFile(workspace.id, 'Untitled Diagram')
    if (fileId) navigate(`/editor/${workspace.id}/${fileId}`)
  }

  return (
    <section style={{ marginBottom: 48 }}>
      {/* Workspace header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {editingWs ? (
            <InlineInput
              value={workspace.name}
              onConfirm={v => { renameWorkspace(workspace.id, v); setEditingWs(false) }}
              onCancel={() => setEditingWs(false)}
            />
          ) : (
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0, cursor: 'default' }} onDoubleClick={() => setEditingWs(true)}>
              {workspace.name}
            </h2>
          )}
          <button onClick={() => setEditingWs(true)} title="Rename" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
            <Pencil size={12} />
          </button>
          {canDelete && (
            <button onClick={() => { if (confirm(`Delete "${workspace.name}"?`)) deleteWorkspace(workspace.id) }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <button
          onClick={handleNewFile}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={13} /> New file
        </button>
      </div>

      {/* Files grid */}
      {workspace.files.length === 0 ? (
        <button
          onClick={handleNewFile}
          style={{ width: '100%', border: '2px dashed #f0f0f0', borderRadius: 16, padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#ccc', cursor: 'pointer', background: 'none' }}
        >
          <Plus size={20} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Create your first diagram</span>
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {workspace.files.map(file => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={() => navigate(`/editor/${workspace.id}/${file.id}`)}
              onRename={name => renameFile(workspace.id, file.id, name)}
              onDelete={() => deleteFile(workspace.id, file.id)}
            />
          ))}
          <button
            onClick={handleNewFile}
            style={{ border: '2px dashed #f0f0f0', borderRadius: 16, minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#ccc', cursor: 'pointer', background: 'none' }}
          >
            <Plus size={18} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>New diagram</span>
          </button>
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const { user, signOut } = useAuth()
  const { workspaces, createWorkspace, loading } = useAppStore()
  const navigate = useNavigate()

  const displayName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? 'User'
  const photoUrl: string | undefined = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const firstName = displayName.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #f0f0f0', height: 56, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 14 L6 3 L10.5 10.5 L14 7" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>FreeDraw</span>
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                {initials}
              </div>
            )}
            <span style={{ fontSize: 13, color: '#555' }}>{displayName}</span>
          </div>
          <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
            <div style={{ width: 24, height: 24, border: '2px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: 0 }}>Good to see you, {firstName}</h1>
                <p style={{ fontSize: 13, color: '#aaa', margin: '4px 0 0' }}>Pick up where you left off</p>
              </div>
              <button
                onClick={() => createWorkspace('New Workspace')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} /> New workspace
              </button>
            </div>

            {workspaces.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 100, color: '#ccc' }}>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No workspaces yet</p>
                <p style={{ fontSize: 13, marginBottom: 24 }}>Create one to get started</p>
                <button
                  onClick={() => createWorkspace('My Workspace')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={14} /> Create workspace
                </button>
              </div>
            ) : (
              workspaces.map(ws => (
                <WorkspaceSection key={ws.id} workspace={ws} canDelete={workspaces.length > 1} />
              ))
            )}
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
