import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { House } from 'lucide-react'
import { useAppStore } from '../store/appStore'

export default function Editor() {
  const { workspaceId, fileId } = useParams<{ workspaceId: string; fileId: string }>()
  const navigate = useNavigate()

  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const isLoadingRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const { getFile, saveScene } = useAppStore()

  const file = workspaceId && fileId ? getFile(workspaceId, fileId) : null

  // Load scene whenever the active file changes
  useEffect(() => {
    if (!excalidrawAPI || !workspaceId || !fileId) return
    const f = getFile(workspaceId, fileId)
    isLoadingRef.current = true
    excalidrawAPI.updateScene({
      elements: f?.elements ?? [],
      appState: { ...(f?.appState ?? {}), collaborators: new Map() },
    })
    setTimeout(() => { isLoadingRef.current = false }, 150)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, workspaceId, excalidrawAPI])

  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (isLoadingRef.current || !workspaceId || !fileId) return
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const { collaborators: _c, openMenu: _m, openPopup: _p, ...rest } = appState
        saveScene(workspaceId, fileId, [...elements], rest)
      }, 400)
    },
    [saveScene, workspaceId, fileId]
  )

  return (
    <div className="w-full h-full relative">
      <div style={{ width: '100%', height: '100%' }}>
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          onChange={handleChange as any}
          initialData={{
            elements: file?.elements ?? [],
            appState: { ...(file?.appState ?? {}), collaborators: new Map() },
          }}
        />
      </div>

      {/* Home button */}
      <button
        onClick={() => navigate('/home')}
        title="Back to home"
        style={{
          position: 'absolute',
          top: 15,
          left: 60,
          zIndex: 100,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          border: '1px solid #e5e5e5',
          background: '#fff',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
      >
        <House size={15} color="#7c3aed" />
      </button>
    </div>
  )
}
