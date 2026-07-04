import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuthContext } from '../hooks/AuthContext'

export default function Login() {
  const { entrar } = useAuthContext()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      await entrar(email, senha)
      navigate('/')
    } catch (err) {
      setErro(traduzErro(err.message))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="tela-login">
      <div className="caixa-login">
        <img src={logo} alt="Logo Bela Sul" />

        <div className="nome-empresa">BELA SUL</div>
        <div className="slogan-empresa">Tradição e Qualidade</div>

        <h2 style={{ fontSize: '1.2rem' }}>
          Entrar no sistema
        </h2>

        {erro && <div className="mensagem-erro">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              placeholder="Digite sua senha"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primario btn-grande"
            disabled={carregando}
          >
            {carregando ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function traduzErro(mensagem) {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (mensagem.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  return mensagem
}