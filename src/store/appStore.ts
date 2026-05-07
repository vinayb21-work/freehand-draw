import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Workspace, DiagramFile } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

interface AppStore {
  userId: string | null
  workspaces: Workspace[]
  loading: boolean

  initForUser: (uid: string) => Promise<void>
  clearUser: () => void

  createWorkspace: (name: string) => void
  renameWorkspace: (id: string, name: string) => void
  deleteWorkspace: (id: string) => void

  createFile: (workspaceId: string, name: string) => string | null
  renameFile: (workspaceId: string, fileId: string, name: string) => void
  deleteFile: (workspaceId: string, fileId: string) => void

  saveScene: (workspaceId: string, fileId: string, elements: any[], appState: Record<string, any>) => void
  getFile: (workspaceId: string, fileId: string) => DiagramFile | null
}

export const useAppStore = create<AppStore>()((set, get) => ({
  userId: null,
  workspaces: [],
  loading: false,

  initForUser: async (uid) => {
    if (get().userId === uid) return
    set({ userId: uid, loading: true })

    const { data: wsRows } = await supabase
      .from('workspaces')
      .select('id, name, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: true })

    if (!wsRows || wsRows.length === 0) {
      // Bootstrap default workspace + file for new user
      const wsId = uuid()
      const fileId = uuid()
      const now = new Date().toISOString()
      await supabase.from('workspaces').insert({ id: wsId, user_id: uid, name: 'My Workspace', created_at: now })
      await supabase.from('files').insert({ id: fileId, workspace_id: wsId, name: 'Untitled Diagram', elements: [], app_state: {}, created_at: now, updated_at: now })
      set({
        loading: false,
        workspaces: [{
          id: wsId,
          name: 'My Workspace',
          createdAt: Date.now(),
          files: [{ id: fileId, name: 'Untitled Diagram', elements: [], appState: {}, createdAt: Date.now(), updatedAt: Date.now() }],
        }],
      })
      return
    }

    const wsIds = wsRows.map((w) => w.id)
    const { data: fileRows } = await supabase
      .from('files')
      .select('id, workspace_id, name, elements, app_state, created_at, updated_at')
      .in('workspace_id', wsIds)
      .order('created_at', { ascending: true })

    const workspaces: Workspace[] = wsRows.map((w) => ({
      id: w.id,
      name: w.name,
      createdAt: new Date(w.created_at).getTime(),
      files: (fileRows ?? [])
        .filter((f) => f.workspace_id === w.id)
        .map((f) => ({
          id: f.id,
          name: f.name,
          elements: f.elements ?? [],
          appState: f.app_state ?? {},
          createdAt: new Date(f.created_at).getTime(),
          updatedAt: new Date(f.updated_at).getTime(),
        })),
    }))

    set({ workspaces, loading: false })
  },

  clearUser: () => {
    set({ userId: null, workspaces: [], loading: false })
  },

  createWorkspace: (name) => {
    const uid = get().userId
    if (!uid) return
    const id = uuid()
    const fileId = uuid()
    const now = Date.now()
    const newFile: DiagramFile = { id: fileId, name: 'Untitled Diagram', elements: [], appState: {}, createdAt: now, updatedAt: now }
    const newWs: Workspace = { id, name, files: [newFile], createdAt: now }
    set((s) => ({ workspaces: [...s.workspaces, newWs] }))
    const isoNow = new Date(now).toISOString()
    supabase.from('workspaces').insert({ id, user_id: uid, name, created_at: isoNow }).then()
    supabase.from('files').insert({ id: fileId, workspace_id: id, name: 'Untitled Diagram', elements: [], app_state: {}, created_at: isoNow, updated_at: isoNow }).then()
  },

  renameWorkspace: (id, name) => {
    set((s) => ({ workspaces: s.workspaces.map((w) => w.id === id ? { ...w, name } : w) }))
    supabase.from('workspaces').update({ name }).eq('id', id).then()
  },

  deleteWorkspace: (id) => {
    set((s) => ({ workspaces: s.workspaces.filter((w) => w.id !== id) }))
    supabase.from('workspaces').delete().eq('id', id).then()
  },

  createFile: (workspaceId, name) => {
    const id = uuid()
    const now = Date.now()
    const file: DiagramFile = { id, name, elements: [], appState: {}, createdAt: now, updatedAt: now }
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, files: [...w.files, file] } : w
      ),
    }))
    const isoNow = new Date(now).toISOString()
    supabase.from('files').insert({ id, workspace_id: workspaceId, name, elements: [], app_state: {}, created_at: isoNow, updated_at: isoNow }).then()
    return id
  },

  renameFile: (workspaceId, fileId, name) => {
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, files: w.files.map((f) => f.id === fileId ? { ...f, name } : f) } : w
      ),
    }))
    supabase.from('files').update({ name }).eq('id', fileId).then()
  },

  deleteFile: (workspaceId, fileId) => {
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, files: w.files.filter((f) => f.id !== fileId) } : w
      ),
    }))
    supabase.from('files').delete().eq('id', fileId).then()
  },

  saveScene: (workspaceId, fileId, elements, appState) => {
    const updatedAt = Date.now()
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, files: w.files.map((f) => f.id === fileId ? { ...f, elements, appState, updatedAt } : f) }
          : w
      ),
    }))
    supabase.from('files')
      .update({ elements, app_state: appState, updated_at: new Date(updatedAt).toISOString() })
      .eq('id', fileId)
      .then()
  },

  getFile: (workspaceId, fileId) => {
    const ws = get().workspaces.find((w) => w.id === workspaceId)
    return ws?.files.find((f) => f.id === fileId) ?? null
  },
}))
