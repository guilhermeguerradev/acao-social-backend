export const publicUserSelect = {
  isAdmin: true,
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const

export const roleUserSelect = {
  id: true,
  name: true,
  email: true,
} as const

export const medicoWithUserSelect = {
  id: true,
  userId: true,
  user: {
    select: roleUserSelect,
  },
} as const

export const instrutorWithUserSelect = {
  id: true,
  userId: true,
  user: {
    select: roleUserSelect,
  },
} as const

export const beneficiarioSelect = {
  id: true,
  name: true,
  telefone: true,
  isAluno: true,
  curso: true,
  createdAt: true,
} as const
