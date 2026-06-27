import { Stage, Layer } from 'react-konva'
import BodyPartShape from './BodyPartShape'
import { PART_BY_KIND } from '../parts/shapes'
import type { PartKind } from '../types'

/** Small static preview of a part, fit into a square box. Used in the parts tray. */
export default function PartThumb({ kind, size = 60 }: { kind: PartKind; size?: number }) {
  const def = PART_BY_KIND[kind]
  const pad = 8
  const fit = Math.min((size - pad * 2) / def.bbox.w, (size - pad * 2) / def.bbox.h)
  return (
    <Stage width={size} height={size} listening={false}>
      <Layer>
        <BodyPartShape
          kind={kind}
          x={size / 2}
          y={size / 2}
          scaleX={fit}
          scaleY={fit}
          listening={false}
          opacity={0.85}
        />
      </Layer>
    </Stage>
  )
}
