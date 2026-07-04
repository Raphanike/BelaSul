import { supabase } from './supabaseClient'

export async function listarClientes(termo = '') {
  let query = supabase.from('clientes').select('*').order('nome', { ascending: true })

  if (termo && termo.trim() !== '') {
    query = query.ilike('nome', `%${termo.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarClientePorId(id) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function criarCliente(cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([
      {
        nome: cliente.nome.trim(),
        telefone: cliente.telefone?.trim() || null,
        endereco: cliente.endereco?.trim() || null,
        observacoes: cliente.observacoes?.trim() || null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarCliente(id, cliente) {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nome: cliente.nome.trim(),
      telefone: cliente.telefone?.trim() || null,
      endereco: cliente.endereco?.trim() || null,
      observacoes: cliente.observacoes?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function excluirCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}
