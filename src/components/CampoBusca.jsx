export default function CampoBusca({ valor, onChange, placeholder }) {
  return (
    <div className="campo-busca">
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Pesquisar...'}
        aria-label={placeholder || 'Pesquisar'}
      />
    </div>
  )
}
