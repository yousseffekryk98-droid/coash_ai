export type IntegrationProvider = {
  id:
    | 'apple-health'
    | 'google-fit'
    | 'garmin'
    | 'dexcom'
    | 'abbott-libre'
    | 'nutritionix'
    | 'edamam'
    | 'stripe'
    | 'paypal'
    | 'whatsapp'
    | 'google-drive'
    | 'dropbox'
    | 'withings'
    | 'renpho'
  name: string
  category: 'Wearable' | 'CGM' | 'Food API' | 'Payments' | 'Messaging' | 'Backups' | 'Smart Scale'
  status: 'planned' | 'in-progress' | 'ready-for-api-keys'
  notes: string
}

export const integrationProviders: IntegrationProvider[] = [
  {
    id: 'apple-health',
    name: 'Apple Health',
    category: 'Wearable',
    status: 'ready-for-api-keys',
    notes: 'Sync steps, sleep stages, and resting heart rate through secure backend tokens.',
  },
  {
    id: 'google-fit',
    name: 'Google Fit',
    category: 'Wearable',
    status: 'ready-for-api-keys',
    notes: 'Daily wearable metrics feed and recovery flags.',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    category: 'Wearable',
    status: 'planned',
    notes: 'Support endurance-focused athlete cohorts.',
  },
  {
    id: 'dexcom',
    name: 'Dexcom CGM',
    category: 'CGM',
    status: 'in-progress',
    notes: 'Real-time glucose stream for diabetic mode clients.',
  },
  {
    id: 'abbott-libre',
    name: 'Abbott Libre',
    category: 'CGM',
    status: 'planned',
    notes: 'Alternative CGM provider stream.',
  },
  {
    id: 'nutritionix',
    name: 'Nutritionix',
    category: 'Food API',
    status: 'ready-for-api-keys',
    notes: 'Branded food lookup and barcode metadata.',
  },
  {
    id: 'edamam',
    name: 'Edamam',
    category: 'Food API',
    status: 'planned',
    notes: 'Recipe enrichment and restaurant alternatives.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    status: 'ready-for-api-keys',
    notes: 'Subscriptions and one-time plans via webhooks.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'Payments',
    status: 'planned',
    notes: 'Optional payment rail for broader regional support.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Messaging',
    status: 'in-progress',
    notes: 'Meal reminders and coach nudges in high-open channel.',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Backups',
    status: 'planned',
    notes: 'Bloodwork and video archives backup.',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Backups',
    status: 'planned',
    notes: 'Alternative backup provider.',
  },
  {
    id: 'withings',
    name: 'Withings Scale',
    category: 'Smart Scale',
    status: 'planned',
    notes: 'Automatic morning weight sync via cloud integration.',
  },
  {
    id: 'renpho',
    name: 'Renpho Scale',
    category: 'Smart Scale',
    status: 'planned',
    notes: 'Automatic bodyweight and body fat logs.',
  },
]

export const integrationChecklist = [
  'Wearable API: Apple Health, Google Fit, Garmin sync',
  'CGM Integration: real-time glucose monitoring',
  'Barcode Scanner: camera-based food logging',
  'Global Food API: 1M+ branded products',
  'Payment Gateway: Stripe and PayPal',
  'WhatsApp Automation: reminders and check-ins',
  'Smart Scale Sync: automatic morning weight logs',
]
