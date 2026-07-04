import { supabase } from './supabaseClient'

const BUCKET = 'produtos'

export async function listarProdutos(termo = '') {
  let query = supabase.from('produtos').select('*').order('nome', { ascending: true })

  if (termo && termo.trim() !== '') {
    query = query.ilike('nome', `%${termo.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function buscarProdutoPorId(id) {
  const { data, error } = await supabase.from('produtos').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function uploadImagemProduto(arquivo) {
  if (!arquivo) return null
  const extensao = arquivo.name.split('.').pop()
  const nomeArquivo = `${crypto.randomUUID()}.${extensao}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(nomeArquivo, arquivo, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nomeArquivo)
  return data.publicUrl
}

export async function criarProduto(produto) {
  const { data, error } = await supabase
    .from('produtos')
    .insert([
      {
        nome: produto.nome.trim(),
        preco: Number(produto.preco),
        tipo_venda: produto.tipo_venda,
        unidade: produto.unidade || (produto.tipo_venda === 'peso' ? 'kg' : 'un'),
        imagem_url: produto.imagem_url || null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function atualizarProduto(id, produto) {
  const { data, error } = await supabase
    .from('produtos')
    .update({
      nome: produto.nome.trim(),
      preco: Number(produto.preco),
      tipo_venda: produto.tipo_venda,
      unidade: produto.unidade || (produto.tipo_venda === 'peso' ? 'kg' : 'un'),
      imagem_url: produto.imagem_url || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function excluirProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw error
}
