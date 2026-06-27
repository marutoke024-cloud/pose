export type PartKind =
  | 'head'
  | 'neck'
  | 'torso'
  | 'pelvis'
  | 'upperArm'
  | 'forearm'
  | 'hand'
  | 'thigh'
  | 'shin'
  | 'foot'
  | 'breast'

export type Skeleton = 'masculine' | 'feminine'

export interface PartInstance {
  id: string
  kind: PartKind
  /** which skeleton this part's silhouette is drawn from */
  variant: Skeleton
  x: number
  y: number
  rotation: number
  /** full konva scale incl. flips (negative) and resize magnitude */
  scaleX: number
  scaleY: number
}

export interface SavedWork {
  id: string
  name: string
  /** PNG data URL thumbnail (transparent, parts only) */
  thumb: string
  createdAt: number
  updatedAt: number
  /** serialized scene so a work can be re-opened in the editor */
  parts: PartInstance[]
  partsOpacity: number
}
