import { Link } from 'react-router-dom'

export default function Upgrade() {
  return (
    <div className="profile-screen screen-scroll" style={{ padding: 24 }}>
      <Link to="/profile" className="back-btn" style={{ display: 'inline-flex', marginBottom: 24, textDecoration: 'none' }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>HabitForge Pro</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Unlock heatmaps, CSV export & unlimited habits</p>
      <button type="button" className="btn-primary-lg">
        Upgrade — $4.99/mo
      </button>
    </div>
  )
}
