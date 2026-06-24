// Canonical reference data from the product blueprint.

// §3 Supported languages (seeded; more can be added from CMS).
export const SEED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', sortOrder: 1 },
  { code: 'en', name: 'English', nativeName: 'English', sortOrder: 2 },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sortOrder: 3 },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sortOrder: 4 },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sortOrder: 5 },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sortOrder: 6 },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sortOrder: 7 },
] as const

// §5 Home screen categories.
export const SEED_CATEGORIES = [
  { key: 'happy', name: 'Happy' },
  { key: 'sad', name: 'Sad' },
  { key: 'good_morning', name: 'Good Morning' },
  { key: 'good_night', name: 'Good Night' },
  { key: 'friendship', name: 'Friendship' },
  { key: 'love', name: 'Love' },
  { key: 'motivational', name: 'Motivational' },
  { key: 'devotional', name: 'Devotional' },
  { key: 'festival', name: 'Festival' },
  { key: 'shayari', name: 'Shayari' },
  { key: 'birthday', name: 'Birthday' },
  { key: 'anniversary', name: 'Anniversary' },
  { key: 'attitude', name: 'Attitude' },
  { key: 'emotional', name: 'Emotional' },
] as const

// §11 Share targets.
export const SHARE_PLATFORMS = [
  'whatsapp',
  'facebook',
  'instagram',
  'telegram',
  'snapchat',
  'other',
] as const
export type SharePlatform = (typeof SHARE_PLATFORMS)[number]

export const CONTENT_TYPES = ['image', 'video'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const CONTENT_STATUSES = ['draft', 'published'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const REPORT_STATUSES = ['pending', 'resolved', 'ignored'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
