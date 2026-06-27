import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadWorks, deleteWork } from '../lib/storage'
import type { SavedWork } from '../types'

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function Gallery() {
  const navigate = useNavigate()
  const [works, setWorks] = useState<SavedWork[]>([])

  useEffect(() => {
    setWorks(loadWorks())
  }, [])

  const onDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this work?')) return
    setWorks(deleteWork(id))
  }

  return (
    <div className="gallery">
      <div className="gal-top">
        <div className="gal-brand">
          OMAKASE
          <span className="jp">おまかせ</span>
        </div>
        <div className="gal-meta">
          Pose Atari Studio
          <br />
          {fmtDate(Date.now())}
        </div>
      </div>

      <div className="gal-hero">
        <h1>
          <span className="accentline">
            <span>Block out</span>
          </span>
          <span className="accentline">
            <span>
              the <em>pose</em>.
            </span>
          </span>
        </h1>
        <p className="gal-sub">
          Drop semi-transparent mannequin masses over any reference, rotate and flip them into
          place, and export a transparent atari underlay for your sketch. No rigging, no
          auto-posing — just blocks, your hand, and speed.
        </p>
        <div className="gal-cta">
          <button className="btn primary" onClick={() => navigate('/edit')}>
            New work →
          </button>
          <a
            className="btn ghost"
            href="https://www.clipstudio.net/"
            target="_blank"
            rel="noreferrer"
          >
            For Clip Studio & co.
          </a>
        </div>
      </div>

      <div className="gal-divider">
        <h2>Works</h2>
        <span className="count">
          {works.length.toString().padStart(2, '0')} saved
        </span>
      </div>

      <div className="gal-grid">
        <button
          className="card new"
          style={{ animationDelay: '0ms' }}
          onClick={() => navigate('/edit')}
        >
          <span className="plus">+</span>
          <span className="new-label">New work</span>
        </button>

        {works.map((w, i) => (
          <div
            key={w.id}
            className="card"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
            onClick={() => navigate(`/edit/${w.id}`)}
          >
            <span className="card-index">{(i + 1).toString().padStart(2, '0')}</span>
            <img className="card-img" src={w.thumb} alt={w.name} loading="lazy" />
            <div className="card-grain" />
            <button
              className="card-del"
              onClick={(e) => onDelete(e, w.id)}
              title="Delete work"
            >
              ✕
            </button>
            <div className="card-foot">
              <span className="card-name">{w.name}</span>
              <span className="card-date">{fmtDate(w.updatedAt)}</span>
            </div>
          </div>
        ))}

        {works.length === 0 && (
          <div className="gal-empty">No works yet — start with a new one.</div>
        )}
      </div>

      <div className="gal-footer">
        <span>Omakase — Pose Atari Studio</span>
        <span>React · Konva · {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
