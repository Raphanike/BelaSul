import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthContext'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Produtos from './pages/Produtos'
import Catalogo from './pages/Catalogo'
import NovoPedido from './pages/NovoPedido'
import Historico from './pages/Historico'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes"
            element={
              <RotaProtegida>
                <Clientes />
              </RotaProtegida>
            }
          />
          <Route
            path="/produtos"
            element={
              <RotaProtegida>
                <Produtos />
              </RotaProtegida>
            }
          />
          <Route
            path="/catalogo"
            element={
              <RotaProtegida>
                <Catalogo />
              </RotaProtegida>
            }
          />
          <Route
            path="/pedido-novo"
            element={
              <RotaProtegida>
                <NovoPedido />
              </RotaProtegida>
            }
          />
          <Route
  path="/pedido-novo/:id"
  element={
    <RotaProtegida>
      <NovoPedido />
    </RotaProtegida>
  }
/>
          <Route
            path="/historico"
            element={
              <RotaProtegida>
                <Historico />
              </RotaProtegida>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
