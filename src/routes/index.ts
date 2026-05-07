import { Router } from 'express'

import authRoutes from '../modules/auth/auth.routes'
import consultaRoutes from '../modules/consulta/consulta.routes'
import aulaRoutes from '../modules/aula/aula.routes'
import matriculaRoutes from '../modules/matricula/matricula.routes'
import beneficiarioRoutes from '../modules/beneficiario/beneficiario.routes'
import userRoutes from '../modules/user/user.routes'
import medicoRoutes from '../modules/medico/medico.routes'
import instrutorRoutes from '../modules/instrutor/instrutor.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/consultas', consultaRoutes)
router.use('/aulas', aulaRoutes)
router.use('/matriculas', matriculaRoutes)
router.use('/beneficiarios', beneficiarioRoutes)
router.use('/users', userRoutes)
router.use('/medicos', medicoRoutes)
router.use('/instrutores', instrutorRoutes)

export default router