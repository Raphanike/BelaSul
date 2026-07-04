export default function Modal({ titulo, aberto, onFechar, children }) {
  if (!aberto) return null

  return (
    <div className="overlay-modal" onClick={onFechar}>
      <div className="conteudo-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>{titulo}</h2>
          <button className="btn btn-outline btn-icone" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
