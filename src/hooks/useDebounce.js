import { useEffect, useState } from 'react'

export function useDebounce(valor, atraso = 300) {
  const [valorAtrasado, setValorAtrasado] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setValorAtrasado(valor), atraso)
    return () => clearTimeout(timer)
  }, [valor, atraso])

  return valorAtrasado
}
