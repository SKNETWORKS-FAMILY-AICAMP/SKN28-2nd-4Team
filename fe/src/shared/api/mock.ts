import type { ArchitectureResponse } from '@/shared/api/contracts'

export function getMockArchitecture(): ArchitectureResponse {
  return {
    service_name: 'Retention Strategy Backend (mock)',
    service_version: 'mock',
    repo_root: 'SKN28-2nd-4team',
    docs_dir: 'docs',
    scenario_dir: 'scenarios',
    replay_dir: 'be/runtime/replays',
    mdp_engine: 'Mocked architecture contract for frontend development.',
    prediction_engine: 'Mocked prediction contract used when the backend is unreachable in development.',
    research_workspace: 'back_research',
    deployment_note:
      'Frontend is using contract-safe mock data because the backend was unreachable or API fallback is enabled.',
  }
}
