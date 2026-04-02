export type RoadmapTask = {
  id: string
  title: string
  phase: 'Milestone 1' | 'Milestone 2' | 'Milestone 3'
  priority: 'P0' | 'P1' | 'P2'
}

export const roadmapTasks: RoadmapTask[] = [
  { id: 'profile-persist', title: 'Persist profile fields to Supabase', phase: 'Milestone 1', priority: 'P0' },
  { id: 'daily-log-submit', title: 'Persist daily log submissions', phase: 'Milestone 1', priority: 'P0' },
  { id: 'required-validation', title: 'Add profile and daily log validation', phase: 'Milestone 1', priority: 'P1' },
  { id: 'coach-today-cards', title: 'Coach today-status cards from real data', phase: 'Milestone 2', priority: 'P0' },
  { id: 'libido-alert-rule', title: '3-day low-libido alert trigger', phase: 'Milestone 2', priority: 'P0' },
  { id: 'coach-note-action', title: 'One-click coach intervention note', phase: 'Milestone 2', priority: 'P1' },
  { id: 'onboarding-flow', title: 'Client onboarding flow', phase: 'Milestone 3', priority: 'P1' },
  { id: 'legal-pages', title: 'Legal and disclaimer pages', phase: 'Milestone 3', priority: 'P1' },
  { id: 'vercel-release', title: 'Vercel production deployment setup', phase: 'Milestone 3', priority: 'P0' },
]
