import { getJson } from '@/shared/api/http'
import type { SimulatorDashboardData } from '@/features/simulator/contracts'

export function getSimulatorDashboard() {
  return getJson<SimulatorDashboardData>('/api/simulator/dashboard')
}
