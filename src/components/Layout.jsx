import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuthContext } from '../hooks/AuthContext'

const ITENS_MENU = [
  { rota: '/', rotulo: '📊 Painel', fim: true },
  { rota: '/pedido-novo', rotulo: '🛒 Novo Pedido' },
  { rota: '/clientes', rotulo: '👥 Clientes' },
  { rota: '/produtos', rotulo: '📦 Produtos' },
  { rota: '/catalogo', rotulo: '🖼️ Catálogo' },
  { rota: '/historico', rotulo: '🧾 Histórico' },
]

export default function Layout({ children }) {
  const { usuario, sair } = useAuthContext()
  const navigate = useNavigate()

  async function handleSair() {
    await sair()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <img src={logo} alt="Logo Bela Sul" />
        <div>
          <div className="titulo-empresa">BELA SUL</div>
          <div className="subtitulo-empresa">Tradição e Qualidade</div>
        </div>
        <div className="usuario-info">
          <span>{usuario?.user_metadata?.nome || usuario?.email}</span>
          <button className="btn btn-outline btn-icone" style={{ color: '#fff', borderColor: '#fff' }} onClick={handleSair}>
            Sair
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-nav">
          {ITENS_MENU.map((item) => (
            <NavLink
              key={item.rota}
              to={item.rota}
              end={item.fim}
              className={({ isActive }) => (isActive ? 'ativo' : '')}
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <main className="app-main">{children}</main>
      </div>
    </div>
  )
}
