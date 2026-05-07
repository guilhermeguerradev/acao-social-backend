import { Router } from 'express'
import { ConsultaController } from './consulta.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createConsultaSchema, updateConsultaSchema } from './consulta.schema'

const router = Router()
const controller = new ConsultaController()

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['MEDICO']),
  validate(createConsultaSchema),
  controller.create
)

router.get('/', authMiddleware, controller.findAll)
router.get('/:id', authMiddleware, controller.findById)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['MEDICO']),
  validate(updateConsultaSchema),
  controller.update
)

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['MEDICO']),
  controller.delete
)

export default router
