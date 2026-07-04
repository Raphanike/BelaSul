import Modal from './Modal'

export default function ConfirmacaoModal({ aberto, titulo, mensagem, onConfirmar, onCancelar }) {
  return (
    <Modal titulo={titulo} aberto={aberto} onFechar={onCancelar}>
      <p style={{ fontSize: '1.1rem', marginBottom: 24 }}>{mensagem}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" onClick={onCancelar}>
          Cancelar
        </button>
        <button className="btn btn-perigo" onClick={onConfirmar}>
          Confirmar
        </button>
      </div>
    </Modal>
  )
}
