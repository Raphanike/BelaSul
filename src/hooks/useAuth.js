import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const entrar = useCallback(async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    return data
  }, [])

  const cadastrar = useCallback(async (email, senha, nome) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    })
    if (error) throw error
    return data
  }, [])

  const sair = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return {
    session,
    usuario: session?.user || null,
    carregando,
    entrar,
    cadastrar,
    sair,
  }
}
