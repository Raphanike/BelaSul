import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuthContext } from '../hooks/AuthContext'

export default function Login() {
  const { entrar, cadastrar } = useAuthContext()
  const navigate = useNavigate()

  const [modoCadastro, setModoCadastro] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setCarregando(true)
    try {
      if (modoCadastro) {
        await cadastrar(email, senha, nome)
        setSucesso('Cadastro realizado! Verifique seu e-mail para confirmar o acesso, se solicitado, ou faça login.')
        setModoCadastro(false)
      } else {
        await entrar(email, senha)
        navigate('/')
      }
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
          {modoCadastro ? 'Criar conta de acesso' : 'Entrar no sistema'}
        </h2>

        {erro && <div className="mensagem-erro">{erro}</div>}
        {sucesso && <div className="mensagem-sucesso">{sucesso}</div>}

        <form onSubmit={handleSubmit}>
          {modoCadastro && (
            <div className="campo">
              <label htmlFor="nome">Seu nome</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Maria da Silva"
              />
            </div>
          )}

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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button type="submit" className="btn btn-primario btn-grande" disabled={carregando}>
            {carregando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <button
          className="alternar-modo"
          onClick={() => {
            setModoCadastro(!modoCadastro)
            setErro('')
            setSucesso('')
          }}
        >
          {modoCadastro ? 'Já tenho conta, quero entrar' : 'Ainda não tenho conta, quero cadastrar'}
        </button>
      </div>
    </div>
  )
}

function traduzErro(mensagem) {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (mensagem.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (mensagem.includes('Password should be at least')) return 'A senha deve ter ao menos 6 caracteres.'
  return mensagem
}
