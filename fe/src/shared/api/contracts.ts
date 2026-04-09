export type ArchitectureResponse = {
  service_name: string
  service_version: string
  repo_root: string
  docs_dir: string
  scenario_dir: string
  replay_dir: string
  mdp_engine: string
  prediction_engine: string
  research_workspace: string
  deployment_note: string
}

export type ScenarioSummary = {
  scenario_id: string
  label: string
  description: string
  max_turns: number
}

export type PredictionResponse = {
  engine_id: string
  engine_source: string
  churn_probability: number
  retention_probability: number
  risk_band: string
  drivers: string[]
}
