import { formatarMoeda } from '../utils/formatters'

const IMAGEM_PADRAO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="100%" height="100%" fill="#e8e5db"/><text x="50%" y="50%" font-size="14" text-anchor="middle" fill="#999" dy=".3em">Sem imagem</text></svg>`
  )

export default function ProdutoCard({ produto, onClick, acaoRotulo = 'Adicionar' }) {
  return (
    <div className="produto-card" onClick={() => onClick?.(produto)}>
      <img
        src={produto.imagem_url || IMAGEM_PADRAO}
        alt={produto.nome}
        className="imagem-produto"
        onError={(e) => {
          e.currentTarget.src = IMAGEM_PADRAO
        }}
      />
      <div className="conteudo-produto">
        <span className="tag">{produto.tipo_venda === 'peso' ? 'Por peso' : 'Por unidade'}</span>
        <span className="nome-produto">{produto.nome}</span>
        <span className="preco-produto">
          {formatarMoeda(produto.preco)}
          {produto.tipo_venda === 'peso' ? ` / ${produto.unidade || 'kg'}` : ''}
        </span>
        {onClick && (
          <button className="btn btn-primario" style={{ marginTop: 8 }}>
            {acaoRotulo}
          </button>
        )}
      </div>
    </div>
  )
}
