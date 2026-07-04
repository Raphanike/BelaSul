import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/AuthContext'
import Loading from './Loading'

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuthContext()

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading texto="Verificando sessão..." />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return children
}
