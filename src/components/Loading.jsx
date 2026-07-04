export default function Loading({ texto = 'Carregando...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div className="spinner" />
      <p style={{ color: '#777' }}>{texto}</p>
    </div>
  )
}
