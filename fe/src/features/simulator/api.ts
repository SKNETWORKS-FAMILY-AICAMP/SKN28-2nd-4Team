import { getJsonWithFallback } from '@/shared/api/http'
import { getMockSimulatorDashboard } from '@/features/simulator/mock'
import type { SimulatorDashboardData } from '@/features/simulator/contracts'

export function getSimulatorDashboard() {
  return getJsonWithFallback<SimulatorDashboardData>('/api/simulator/dashboard', getMockSimulatorDashboard)
}
