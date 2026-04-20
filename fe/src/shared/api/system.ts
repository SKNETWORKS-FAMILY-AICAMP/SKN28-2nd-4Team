import { getJson } from '@/shared/api/http'
import type { ArchitectureResponse } from '@/shared/api/contracts'

export function getArchitecture() {
  return getJson<ArchitectureResponse>('/api/system/architecture')
}
