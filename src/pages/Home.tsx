import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Plus, FolderOpen, FileText, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAppStore } from '../store/appStore'
import type { Workspace, DiagramFile } from '../types'

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function InlineInput({
  value,
  onConfirm,
  onCancel,
  className = '',
}: {
  value: string
  onConfirm: (v: string) => void
  onCancel: () => void
  className?: string
}) {
  const [val, setVal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <input
      ref={ref}
      className={`px-2 py-0.5 rounded border border-violet-400 outline-none text-gray-900 bg-white ${className}`}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onConfirm(val.trim() || value)
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => onConfirm(val.trim() || value)}
    />
  )
}

function FileCard({
  file,
  onNavigate,
  onRename,
  onDelete,
}: {
  file: DiagramFile
  onNavigate: () => void
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-200 hover:border-violet-400 hover:shadow-md cursor-pointer p-4 transition-all select-none"
      onClick={() => { if (!editing) onNavigate() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && !editing && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Rename"
            onClick={() => setEditing(true)}
          >
            <Pencil size={11} />
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete"
            onClick={() => { if (confirm(`Delete "${file.name}"?`)) onDelete() }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      <FileText size={28} className="text-violet-500" />

      {editing ? (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <InlineInput
            value={file.name}
            className="w-full text-sm font-medium"
            onConfirm={(v) => { onRename(v); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <p className="font-medium text-sm text-gray-800 mt-3 truncate" onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}>
            {file.name}
          </p>
          <p className="text-xs text-gray-400 mt-1">Edited {timeAgo(file.updatedAt)}</p>
        </>
      )}
    </div>
  )
}

function WorkspaceSection({
  workspace,
  canDelete,
}: {
  workspace: Workspace
  canDelete: boolean
}) {
  const navigate = useNavigate()
  const { renameWorkspace, deleteWorkspace, createFile, renameFile, deleteFile } = useAppStore()
  const [editingWs, setEditingWs] = useState(false)

  function handleNewFile() {
    const fileId = createFile(workspace.id, 'Untitled Diagram')
    if (fileId) {
      navigate(`/editor/${workspace.id}/${fileId}`)
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen size={20} className="text-amber-500 shrink-0" />
        {editingWs ? (
          <InlineInput
            value={workspace.name}
            className="text-lg font-semibold"
            onConfirm={(v) => { renameWorkspace(workspace.id, v); setEditingWs(false) }}
            onCancel={() => setEditingWs(false)}
          />
        ) : (
          <h2
            className="text-lg font-semibold text-gray-900"
            onDoubleClick={() => setEditingWs(true)}
          >
            {workspace.name}
          </h2>
        )}
        <div className="flex items-center gap-1 ml-1">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Rename workspace"
            onClick={() => setEditingWs(true)}
          >
            <Pencil size={13} />
          </button>
          {canDelete && (
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete workspace"
              onClick={() => { if (confirm(`Delete workspace "${workspace.name}" and all its files?`)) deleteWorkspace(workspace.id) }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <button
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
          onClick={handleNewFile}
        >
          <Plus size={14} />
          New file
        </button>
      </div>

      {workspace.files.length === 0 ? (
        <button
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
          onClick={handleNewFile}
        >
          <Plus size={24} />
          <span className="text-sm font-medium">New diagram</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
          {workspace.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onNavigate={() => navigate(`/editor/${workspace.id}/${file.id}`)}
              onRename={(name) => renameFile(workspace.id, file.id, name)}
              onDelete={() => deleteFile(workspace.id, file.id)}
            />
          ))}
          <button
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors min-h-[100px]"
            onClick={handleNewFile}
          >
            <Plus size={20} />
            <span className="text-xs font-medium">New diagram</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user, signOut } = useAuth()
  const { workspaces, createWorkspace, loading } = useAppStore()
  const navigate = useNavigate()

  const displayName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? 'User'
  const photoUrl: string | undefined = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50" style={{ overflow: 'auto' }}>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-6">
        <button
          className="flex items-center gap-2 text-gray-900 font-semibold hover:text-violet-600 transition-colors"
          onClick={() => navigate('/home')}
        >
          <Pencil size={20} className="text-violet-600" />
          <span>FreeDraw</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              {displayName}
            </span>
          </div>

          <button
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            onClick={signOut}
          >
            <LogOut size={15} />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Your workspaces</h1>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                onClick={() => createWorkspace('New Workspace')}
              >
                <Plus size={16} />
                New workspace
              </button>
            </div>

            {workspaces.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No workspaces yet</p>
                <p className="text-sm mt-1">Create a workspace to get started</p>
                <button
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors mx-auto"
                  onClick={() => createWorkspace('My Workspace')}
                >
                  <Plus size={16} />
                  Create workspace
                </button>
              </div>
            ) : (
              workspaces.map((ws) => (
                <WorkspaceSection
                  key={ws.id}
                  workspace={ws}
                  canDelete={workspaces.length > 1}
                />
              ))
            )}
          </>
        )}
      </main>
    </div>
  )
}
