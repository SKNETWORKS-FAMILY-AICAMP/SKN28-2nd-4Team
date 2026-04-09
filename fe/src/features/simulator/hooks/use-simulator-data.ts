import { useEffect, useState } from 'react'

import { getSimulatorDashboard } from '@/features/simulator/api'
import { getMockSimulatorDashboard } from '@/features/simulator/mock'
import type { SimulatorDashboardData } from '@/features/simulator/contracts'
import type { ApiSource } from '@/shared/api/http'

const defaultDashboardData = getMockSimulatorDashboard()

export function useSimulatorData() {
  const [dashboardData, setDashboardData] = useState<SimulatorDashboardData>(defaultDashboardData)
  const [source, setSource] = useState<ApiSource>('mock')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    void getSimulatorDashboard()
      .then(({ data, source }) => {
        if (isCancelled) return
        setDashboardData(data)
        setSource(source)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (isCancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load simulator data.')
      })

    return () => {
      isCancelled = true
    }
  }, [])

  return {
    dashboardData,
    source,
    errorMessage,
  }
}
