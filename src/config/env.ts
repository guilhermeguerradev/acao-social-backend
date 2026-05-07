function normalizeEnvValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return undefined
  }

  const firstChar = trimmedValue[0]
  const lastChar = trimmedValue[trimmedValue.length - 1]

  if (
    trimmedValue.length >= 2 &&
    ((firstChar === '"' && lastChar === '"') || (firstChar === "'" && lastChar === "'"))
  ) {
    return trimmedValue.slice(1, -1).trim()
  }

  return trimmedValue
}

export function getRequiredEnv(name: string): string {
  const value = normalizeEnvValue(process.env[name])

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
  const rawValue = normalizeEnvValue(process.env[name])

  if (!rawValue) {
    return defaultValue
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`)
  }

  return value
}
