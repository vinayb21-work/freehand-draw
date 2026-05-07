export interface DiagramFile {
  id: string
  name: string
  elements: any[]
  appState: Record<string, any>
  createdAt: number
  updatedAt: number
}

export interface Workspace {
  id: string
  name: string
  files: DiagramFile[]
  createdAt: number
}
