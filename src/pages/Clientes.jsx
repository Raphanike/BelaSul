import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import CampoBusca from '../components/CampoBusca'
import Modal from '../components/Modal'
import ConfirmacaoModal from '../components/ConfirmacaoModal'
import Loading from '../components/Loading'
import { useDebounce } from '../hooks/useDebounce'
import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  excluirCliente,
} from '../services/clientesService'

const CLIENTE_VAZIO = { nome: '', telefone: '', endereco: '', observacoes: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebounce(busca, 300)

  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null)
  const [formulario, setFormulario] = useState(CLIENTE_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [clienteParaExcluir, setClienteParaExcluir] = useState(null)

  const carregar = useCallback(async (termo) => {
    setCarregando(true)
    try {
      const dados = await listarClientes(termo)
      setClientes(dados)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar(buscaAtrasada)
  }, [buscaAtrasada, carregar])

  function abrirNovo() {
    setClienteEmEdicao(null)
    setFormulario(CLIENTE_VAZIO)
    setErro('')
    setModalAberto(true)
  }

  function abrirEdicao(cliente) {
    setClienteEmEdicao(cliente)
    setFormulario({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || '',
    })
    setErro('')
    setModalAberto(true)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!formulario.nome.trim()) {
      setErro('O nome do cliente é obrigatório.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      if (clienteEmEdicao) {
        await atualizarCliente(clienteEmEdicao.id, formulario)
      } else {
        await criarCliente(formulario)
      }
      setModalAberto(false)
      carregar(buscaAtrasada)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    try {
      await excluirCliente(clienteParaExcluir.id)
      setClienteParaExcluir(null)
      carregar(buscaAtrasada)
    } catch (err) {
      setErro(err.message)
      setClienteParaExcluir(null)
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1>Clientes</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          + Novo Cliente
        </button>
      </div>

      <CampoBusca valor={busca} onChange={setBusca} placeholder="Pesquisar cliente pelo nome..." />

      {carregando ? (
        <Loading texto="Carregando clientes..." />
      ) : clientes.length === 0 ? (
        <div className="vazio">
          <p>Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div>
          {clientes.map((cliente) => (
            <div className="lista-item" key={cliente.id}>
              <div>
                <div className="info-principal">{cliente.nome}</div>
                <div className="info-secundaria">
                  {cliente.telefone || 'Sem telefone'} {cliente.endereco ? `• ${cliente.endereco}` : ''}
                </div>
              </div>
              <div className="acoes">
                <button className="btn btn-outline" onClick={() => abrirEdicao(cliente)}>
                  Editar
                </button>
                <button className="btn btn-perigo" onClick={() => setClienteParaExcluir(cliente)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        titulo={clienteEmEdicao ? 'Editar Cliente' : 'Novo Cliente'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {erro && <div className="mensagem-erro">{erro}</div>}
        <form onSubmit={handleSalvar}>
          <div className="campo">
            <label htmlFor="nome-cliente">Nome completo *</label>
            <input
              id="nome-cliente"
              type="text"
              value={formulario.nome}
              onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="campo">
            <label htmlFor="telefone-cliente">Telefone (WhatsApp)</label>
            <input
              id="telefone-cliente"
              type="tel"
              value={formulario.telefone}
              onChange={(e) => setFormulario({ ...formulario, telefone: e.target.value })}
              placeholder="Ex: 51999998888"
            />
          </div>
          <div className="campo">
            <label htmlFor="endereco-cliente">Endereço</label>
            <input
              id="endereco-cliente"
              type="text"
              value={formulario.endereco}
              onChange={(e) => setFormulario({ ...formulario, endereco: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="obs-cliente">Observações</label>
            <textarea
              id="obs-cliente"
              rows={3}
              value={formulario.observacoes}
              onChange={(e) => setFormulario({ ...formulario, observacoes: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primario btn-grande" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </form>
      </Modal>

      <ConfirmacaoModal
        aberto={!!clienteParaExcluir}
        titulo="Excluir Cliente"
        mensagem={`Tem certeza que deseja excluir "${clienteParaExcluir?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirmar={handleExcluir}
        onCancelar={() => setClienteParaExcluir(null)}
      />
    </Layout>
  )
}
