export const demandCategories = [
  { value: 'FOOD', label: 'Alimentos ou cesta básica' },
  { value: 'CLOTHING', label: 'Roupas e calçados' },
  { value: 'HYGIENE', label: 'Produtos de higiene pessoal' },
  { value: 'HEALTH', label: 'Medicamentos ou apoio relacionado à saúde' },
  { value: 'EDUCATION', label: 'Apoio educacional' },
  { value: 'SOCIAL_ASSISTANCE', label: 'Orientação ou assistência social' },
  { value: 'OTHER', label: 'Outros' },
] as const

export const demandReturnPreferences = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PHONE_CALL', label: 'Ligação telefônica' },
] as const

export const demandConsent = {
  version: 'contact-v1',
  text: 'Autorizo o uso dos dados informados para análise e contato sobre esta solicitação.',
} as const

export const demandOptions = {
  categories: demandCategories,
  returnPreferences: demandReturnPreferences,
  consent: demandConsent,
}
