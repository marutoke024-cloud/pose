import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import BodyPartShape from '../components/BodyPartShape'
import PartThumb from '../components/PartThumb'
import { PART_DEFS, buildFigure } from '../parts/shapes'
import type { Skeleton } from '../parts/shapes'
import type { PartInstance, PartKind, SavedWork } from '../types'
import { getWork, saveWork, uid } from '../lib/storage'

const BOARD_W = 900
const BOARD_H = 1200

export default function Editor() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [workId] = useState(() => id ?? uid())
  const [title, setTitle] = useState('Untitled')
  const [parts, setParts] = useState<PartInstance[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [partsOpacity, setPartsOpacity] = useState(0.55)
  const [skeleton, setSkeleton] = useState<Skeleton>('masculine')

  const [refImg, setRefImg] = useState<HTMLImageElement | null>(null)
  const [refOpacity, setRefOpacity] = useState(0.6)
  const [refVisible, setRefVisible] = useState(true)

  const [scale, setScale] = useState(0.5)
  const [toast, setToast] = useState('')

  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const partsLayerRef = useRef<Konva.Layer>(null)
  const refLayerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ---- load existing work ----
  useEffect(() => {
    if (!id) return
    const w = getWork(id)
    if (w) {
      setTitle(w.name)
      setParts(w.parts)
      setPartsOpacity(w.partsOpacity)
    }
  }, [id])

  // ---- responsive fit ----
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const pad = 44
      const w = el.clientWidth - pad
      const h = el.clientHeight - pad
      setScale(Math.max(0.1, Math.min(w / BOARD_W, h / BOARD_H)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- transformer follows selection ----
  useEffect(() => {
    const tr = trRef.current
    const layer = partsLayerRef.current
    if (!tr || !layer) return
    if (!selectedId) {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
      return
    }
    const node = layer.findOne<Konva.Shape>(`#${selectedId}`)
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, parts])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1800)
  }, [])

  // ---- mutations ----
  const update = useCallback((pid: string, patch: Partial<PartInstance>) => {
    setParts((prev) => prev.map((p) => (p.id === pid ? { ...p, ...patch } : p)))
  }, [])

  const addPart = useCallback(
    (kind: PartKind) => {
      const nid = uid()
      setParts((prev) => {
        const jitter = (prev.length % 6) * 16
        return [
          ...prev,
          {
            id: nid,
            kind,
            x: BOARD_W / 2 + jitter,
            y: BOARD_H / 2 + jitter,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        ]
      })
      setSelectedId(nid)
    },
    [],
  )

  const addPreset = useCallback(() => {
    setParts((prev) => [
      ...prev,
      ...buildFigure(skeleton).map((p) => ({
        id: uid(),
        kind: p.kind,
        x: p.x,
        y: p.y,
        rotation: p.rotation ?? 0,
        scaleX: p.sx ?? 1,
        scaleY: p.sy ?? 1,
      })),
    ])
    setSelectedId(null)
    showToast(`${skeleton === 'feminine' ? 'Feminine' : 'Masculine'} figure added`)
  }, [showToast, skeleton])

  const selected = useMemo(() => parts.find((p) => p.id === selectedId), [parts, selectedId])

  const flipH = () => selected && update(selected.id, { scaleX: -selected.scaleX })
  const flipV = () => selected && update(selected.id, { scaleY: -selected.scaleY })
  const duplicate = () => {
    if (!selected) return
    const nid = uid()
    setParts((prev) => [...prev, { ...selected, id: nid, x: selected.x + 26, y: selected.y + 26 }])
    setSelectedId(nid)
  }
  const remove = () => {
    if (!selected) return
    setParts((prev) => prev.filter((p) => p.id !== selected.id))
    setSelectedId(null)
  }
  const toFront = () => {
    if (!selected) return
    setParts((prev) => [...prev.filter((p) => p.id !== selected.id), selected])
  }
  const toBack = () => {
    if (!selected) return
    setParts((prev) => [selected, ...prev.filter((p) => p.id !== selected.id)])
  }
  const clearAll = () => {
    if (parts.length && !confirm('Clear all parts from the board?')) return
    setParts([])
    setSelectedId(null)
  }

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.key === 'Escape') setSelectedId(null)
      if (!selected) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        remove()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicate()
      } else if (e.key.toLowerCase() === 'h') {
        flipH()
      } else if (e.key.toLowerCase() === 'v') {
        flipV()
      } else if (e.key === ']') {
        toFront()
      } else if (e.key === '[') {
        toBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, parts])

  // ---- reference image ----
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setRefImg(img)
        setRefVisible(true)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const refRect = useMemo(() => {
    if (!refImg) return null
    const fit = Math.min(BOARD_W / refImg.width, BOARD_H / refImg.height)
    const w = refImg.width * fit
    const h = refImg.height * fit
    return { x: (BOARD_W - w) / 2, y: (BOARD_H - h) / 2, w, h }
  }, [refImg])

  // ---- export helpers ----
  const renderDataURL = useCallback(
    (includeRef: boolean, outWidth: number) => {
      const stage = stageRef.current
      const tr = trRef.current
      const refLayer = refLayerRef.current
      if (!stage) return ''
      tr?.nodes([])
      const refWasVisible = refLayer?.visible() ?? false
      if (!includeRef) refLayer?.visible(false)
      stage.batchDraw()
      const pixelRatio = outWidth / (BOARD_W * scale)
      const url = stage.toDataURL({ pixelRatio, mimeType: 'image/png' })
      if (!includeRef) refLayer?.visible(refWasVisible)
      // restore selection handles
      if (selectedId) {
        const node = partsLayerRef.current?.findOne<Konva.Shape>(`#${selectedId}`)
        if (node) tr?.nodes([node])
      }
      stage.batchDraw()
      return url
    },
    [scale, selectedId],
  )

  const exportPNG = () => {
    if (!parts.length) {
      showToast('Add some parts first')
      return
    }
    const url = renderDataURL(refVisible, BOARD_W * 2)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_') || 'omakase'}_atari.png`
    a.click()
    showToast('PNG exported')
  }

  const save = () => {
    if (!parts.length) {
      showToast('Nothing to save yet')
      return
    }
    const thumb = renderDataURL(false, 420)
    const now = Date.now()
    const existing = getWork(workId)
    const work: SavedWork = {
      id: workId,
      name: title || 'Untitled',
      thumb,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      parts,
      partsOpacity,
    }
    saveWork(work)
    showToast('Saved to gallery')
  }

  const deselectOnEmpty = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null)
  }

  return (
    <div className="editor">
      <header className="ed-header">
        <button className="ed-back" onClick={() => navigate('/')} title="Back to gallery">
          ← MASSE
        </button>
        <input
          className="ed-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          spellCheck={false}
          aria-label="Work title"
        />
        <div className="ed-header-spacer" />
        <div className="ed-actions">
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>
            Load image
          </button>
          <button className="btn ghost" onClick={clearAll}>
            Clear
          </button>
          <button className="btn" onClick={exportPNG}>
            Export PNG
          </button>
          <button className="btn primary" onClick={save}>
            Save
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={onPickImage}
          />
        </div>
      </header>

      <div className="ed-body">
        <aside className="tray">
          <h3>Body parts</h3>
          <div className="tray-grid">
            {PART_DEFS.map((def) => (
              <button
                key={def.kind}
                className="tray-item"
                onClick={() => addPart(def.kind)}
                title={`Add ${def.label}`}
              >
                <PartThumb kind={def.kind} />
                <span>{def.label}</span>
              </button>
            ))}
          </div>
          <div className="tray-figure">
            <h3>Figure</h3>
            <div className="seg" role="group" aria-label="Skeleton type">
              <button
                className={skeleton === 'masculine' ? 'active' : ''}
                onClick={() => setSkeleton('masculine')}
              >
                Masculine
              </button>
              <button
                className={skeleton === 'feminine' ? 'active' : ''}
                onClick={() => setSkeleton('feminine')}
              >
                Feminine
              </button>
            </div>
            <button className="btn ghost tray-preset" onClick={addPreset}>
              + Add full figure
            </button>
          </div>
        </aside>

        <div className="stage-wrap" ref={wrapRef}>
          <div
            className={`artboard${refVisible && refImg ? '' : ' checkers'}`}
            style={{ width: BOARD_W * scale, height: BOARD_H * scale }}
          >
            <Stage
              ref={stageRef}
              width={BOARD_W * scale}
              height={BOARD_H * scale}
              scaleX={scale}
              scaleY={scale}
              style={{ touchAction: 'none' }}
              onMouseDown={deselectOnEmpty}
              onTouchStart={deselectOnEmpty}
            >
              <Layer ref={refLayerRef} listening={false} visible={refVisible}>
                {refRect && refImg && (
                  <KonvaImage
                    image={refImg}
                    x={refRect.x}
                    y={refRect.y}
                    width={refRect.w}
                    height={refRect.h}
                    opacity={refOpacity}
                  />
                )}
              </Layer>

              <Layer ref={partsLayerRef}>
                {parts.map((p) => (
                  <BodyPartShape
                    key={p.id}
                    kind={p.kind}
                    x={p.x}
                    y={p.y}
                    rotation={p.rotation}
                    scaleX={p.scaleX}
                    scaleY={p.scaleY}
                    opacity={partsOpacity}
                    draggable
                    // @ts-expect-error konva id passthrough
                    id={p.id}
                    onClick={() => setSelectedId(p.id)}
                    onTap={() => setSelectedId(p.id)}
                    onDragEnd={(e) =>
                      update(p.id, { x: e.target.x(), y: e.target.y() })
                    }
                    onTransformEnd={(e) => {
                      const n = e.target as Konva.Shape
                      update(p.id, {
                        x: n.x(),
                        y: n.y(),
                        rotation: n.rotation(),
                        scaleX: n.scaleX(),
                        scaleY: n.scaleY(),
                      })
                    }}
                  />
                ))}
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio
                  enabledAnchors={[
                    'top-left',
                    'top-right',
                    'bottom-left',
                    'bottom-right',
                  ]}
                  anchorStroke="#16161a"
                  anchorFill="#e8e6df"
                  anchorStrokeWidth={2}
                  // larger handles + bigger touch hit area for Apple Pencil / finger
                  anchorSize={Math.max(16, 18 / scale)}
                  anchorCornerRadius={8}
                  borderStroke="#e8e6df"
                  borderStrokeWidth={1.5}
                  rotateAnchorOffset={Math.max(34, 40 / scale)}
                  ignoreStroke
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      <footer className="ed-footer">
        <div className="tool-group">
          <span className="label">Selected</span>
          <button className="btn icon" onClick={flipH} disabled={!selected} title="Flip horizontal (H)">
            ⇄
          </button>
          <button className="btn icon" onClick={flipV} disabled={!selected} title="Flip vertical (V)">
            ⇅
          </button>
          <button className="btn icon" onClick={duplicate} disabled={!selected} title="Duplicate (⌘D)">
            ⧉
          </button>
          <button className="btn icon" onClick={toFront} disabled={!selected} title="Bring to front (])">
            ▲
          </button>
          <button className="btn icon" onClick={toBack} disabled={!selected} title="Send to back ([)">
            ▼
          </button>
          <button className="btn icon" onClick={remove} disabled={!selected} title="Delete (⌫)">
            ✕
          </button>
        </div>

        <div className="sep" />

        <div className="slider">
          <label>Parts</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={partsOpacity}
            onChange={(e) => setPartsOpacity(parseFloat(e.target.value))}
          />
          <span className="val">{Math.round(partsOpacity * 100)}%</span>
        </div>

        <div className="sep" />

        <div className="slider">
          <label>Underlay</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={refOpacity}
            disabled={!refImg}
            onChange={(e) => setRefOpacity(parseFloat(e.target.value))}
          />
          <span className="val">{Math.round(refOpacity * 100)}%</span>
        </div>

        <button
          className={`toggle${refVisible ? ' on' : ''}`}
          onClick={() => setRefVisible((v) => !v)}
          disabled={!refImg}
        >
          <span className="sw" />
          {refVisible ? 'Shown' : 'Hidden'}
        </button>

        <span className="hint">Drag to move · corners scale · top handle rotates</span>
      </footer>

      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
