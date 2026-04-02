import type { BiomarkerReading, SupplementProtocolItem, VideoFeedbackItem } from '../types'

export const biomarkerReadings: BiomarkerReading[] = [
  { week: 1, marker: 'testosterone', value: 610, unit: 'ng/dL', minAthleticRange: 450, maxAthleticRange: 900 },
  { week: 8, marker: 'testosterone', value: 480, unit: 'ng/dL', minAthleticRange: 450, maxAthleticRange: 900 },
  { week: 16, marker: 'testosterone', value: 430, unit: 'ng/dL', minAthleticRange: 450, maxAthleticRange: 900 },
  { week: 1, marker: 'ast', value: 27, unit: 'U/L', minAthleticRange: 15, maxAthleticRange: 35 },
  { week: 8, marker: 'ast', value: 31, unit: 'U/L', minAthleticRange: 15, maxAthleticRange: 35 },
  { week: 16, marker: 'ast', value: 39, unit: 'U/L', minAthleticRange: 15, maxAthleticRange: 35 },
  { week: 1, marker: 'alt', value: 26, unit: 'U/L', minAthleticRange: 10, maxAthleticRange: 45 },
  { week: 8, marker: 'alt', value: 29, unit: 'U/L', minAthleticRange: 10, maxAthleticRange: 45 },
  { week: 16, marker: 'alt', value: 44, unit: 'U/L', minAthleticRange: 10, maxAthleticRange: 45 },
  { week: 1, marker: 'creatinine', value: 1.0, unit: 'mg/dL', minAthleticRange: 0.7, maxAthleticRange: 1.3 },
  { week: 8, marker: 'creatinine', value: 1.2, unit: 'mg/dL', minAthleticRange: 0.7, maxAthleticRange: 1.3 },
  { week: 16, marker: 'creatinine', value: 1.35, unit: 'mg/dL', minAthleticRange: 0.7, maxAthleticRange: 1.3 },
  { week: 1, marker: 'egfr', value: 102, unit: 'mL/min', minAthleticRange: 90, maxAthleticRange: 130 },
  { week: 8, marker: 'egfr', value: 95, unit: 'mL/min', minAthleticRange: 90, maxAthleticRange: 130 },
  { week: 16, marker: 'egfr', value: 86, unit: 'mL/min', minAthleticRange: 90, maxAthleticRange: 130 },
  { week: 1, marker: 'ldl', value: 96, unit: 'mg/dL', minAthleticRange: 50, maxAthleticRange: 110 },
  { week: 8, marker: 'ldl', value: 105, unit: 'mg/dL', minAthleticRange: 50, maxAthleticRange: 110 },
  { week: 16, marker: 'ldl', value: 118, unit: 'mg/dL', minAthleticRange: 50, maxAthleticRange: 110 },
]

export const baseSupplementProtocol: SupplementProtocolItem[] = [
  { id: 'vitd3', name: 'Vitamin D3', timing: 'Meal 1 with fats', phaseTarget: 'Any', inventoryLevel: 'OK' },
  { id: 'magnesium', name: 'Magnesium Glycinate', timing: 'Before bed', phaseTarget: 'Luteal', inventoryLevel: 'OK' },
  { id: 'b6', name: 'Vitamin B6', timing: 'Meal 2', phaseTarget: 'Luteal', inventoryLevel: 'OK' },
  { id: 'omega3', name: 'Omega-3', timing: 'Meal 1 or Meal 3', phaseTarget: 'Any', inventoryLevel: 'Low' },
]

export const videoFeedbackArchive: VideoFeedbackItem[] = [
  { id: 'v-04', week: 4, title: 'Week 4 Front Double Biceps Review', durationSec: 122, createdAt: '2026-02-10' },
  { id: 'v-08', week: 8, title: 'Week 8 Conditioning and Waist Control', durationSec: 140, createdAt: '2026-03-08' },
  { id: 'v-12', week: 12, title: 'Week 12 Peak Week Posing Cues', durationSec: 131, createdAt: '2026-04-01' },
]
