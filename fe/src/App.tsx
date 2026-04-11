import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '@/features/simulator/pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
