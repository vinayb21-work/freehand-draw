// NOTE: This component is no longer used — workspace management moved to the Home page.
// Kept for reference only.

import { useState, useRef, useEffect } from 'react'
import { FolderOpen, FileText, Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X, PanelLeft } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { Workspace } from '../types'

function InlineEdit({ value, onConfirm, onCancel }: { value: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={ref}
        className="flex-1 min-w-0 text-sm px-1.5 py-0.5 rounded border border-violet-400 outline-none bg-white"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm(v.trim() || value)
          if (e.key === 'Escape') onCancel()
        }}
      />
      <button onClick={() => onConfirm(v.trim() || value)} className="text-green-500 hover:text-green-600 shrink-0"><Check size={12} /></button>
      <button onClick={onCancel} className="text-red-400 hover:text-red-500 shrink-0"><X size={12} /></button>
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title?: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`p-0.5 rounded transition-colors ${danger ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-gray-700'}`}>
      {children}
    </button>
  )
}

function WorkspaceItem({ workspace }: { workspace: Workspace }) {
  const { renameWorkspace, deleteWorkspace, createFile, renameFile, deleteFile } = useAppStore()
  const [expanded, setExpanded] = useState(true)
  const [editingWs, setEditingWs] = useState(false)
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState(false)
  const [newFileNameVal, setNewFileNameVal] = useState('')

  function handleCreateFile() {
    const name = newFileNameVal.trim() || 'Untitled'
    createFile(workspace.id, name)
    setNewFileName(false)
    setNewFileNameVal('')
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer group select-none hover:bg-gray-50"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="text-gray-400 shrink-0">{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        <FolderOpen size={13} className="text-amber-500 shrink-0" />
        {editingWs ? (
          <InlineEdit value={workspace.name} onConfirm={(v) => { renameWorkspace(workspace.id, v); setEditingWs(false) }} onCancel={() => setEditingWs(false)} />
        ) : (
          <>
            <span className="flex-1 min-w-0 text-sm text-gray-700 truncate font-medium">{workspace.name}</span>
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <IconBtn onClick={(e) => { e.stopPropagation(); setEditingWs(true) }} title="Rename"><Pencil size={11} /></IconBtn>
              <IconBtn onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${workspace.name}"?`)) deleteWorkspace(workspace.id) }} title="Delete" danger><Trash2 size={11} /></IconBtn>
              <IconBtn onClick={(e) => { e.stopPropagation(); setNewFileName(true); setExpanded(true) }} title="New file"><Plus size={11} /></IconBtn>
            </div>
          </>
        )}
      </div>

      {expanded && (
        <div className="ml-5 mt-0.5 space-y-0.5">
          {workspace.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer group select-none hover:bg-gray-50 text-gray-600"
            >
              <FileText size={12} className="shrink-0 opacity-60" />
              {editingFileId === file.id ? (
                <InlineEdit value={file.name} onConfirm={(v) => { renameFile(workspace.id, file.id, v); setEditingFileId(null) }} onCancel={() => setEditingFileId(null)} />
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm truncate">{file.name}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <IconBtn onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id) }} title="Rename"><Pencil size={10} /></IconBtn>
                    <IconBtn onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${file.name}"?`)) deleteFile(workspace.id, file.id) }} title="Delete" danger><Trash2 size={10} /></IconBtn>
                  </div>
                </>
              )}
            </div>
          ))}

          {newFileName && (
            <div className="flex items-center gap-1.5 px-2 py-1">
              <FileText size={12} className="shrink-0 text-gray-400" />
              <input
                autoFocus
                className="flex-1 min-w-0 text-sm px-1.5 py-0.5 rounded border border-violet-400 outline-none bg-white"
                placeholder="File name…"
                value={newFileNameVal}
                onChange={(e) => setNewFileNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFile(); if (e.key === 'Escape') { setNewFileName(false); setNewFileNameVal('') } }}
                onBlur={handleCreateFile}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ onClose }: { onClose: () => void }) {
  const { workspaces, createWorkspace } = useAppStore()
  const [creatingWs, setCreatingWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')

  function handleCreateWs() {
    const name = newWsName.trim() || 'New Workspace'
    createWorkspace(name)
    setCreatingWs(false)
    setNewWsName('')
  }

  return (
    <div className="w-56 h-full bg-white border-r border-gray-200 shadow-xl flex flex-col select-none">
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">FreeDraw</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCreatingWs(true)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="New workspace">
            <Plus size={14} />
          </button>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Close">
            <PanelLeft size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 sidebar-scroll">
        {workspaces.length === 0 && <p className="text-xs text-gray-400 text-center mt-6 px-4">No workspaces yet.</p>}
        {workspaces.map((ws) => <WorkspaceItem key={ws.id} workspace={ws} />)}
        {creatingWs && (
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <FolderOpen size={13} className="text-amber-500 shrink-0" />
            <input
              autoFocus
              className="flex-1 min-w-0 text-sm px-1.5 py-0.5 rounded border border-violet-400 outline-none bg-white"
              placeholder="Workspace name…"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWs(); if (e.key === 'Escape') { setCreatingWs(false); setNewWsName('') } }}
              onBlur={handleCreateWs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
