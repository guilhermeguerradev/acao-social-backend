export function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getRequiredNumberEnv(name: string): number {
  const rawValue = getRequiredEnv(name)
  const value = Number(rawValue)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`)
  }

  return value
}

export function getOptionalNumberEnv(name: string, defaultValue: number): number {
  const rawValue = process.env[name]?.trim()

  if (!rawValue) {
    return defaultValue
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`)
  }

  return value
}
