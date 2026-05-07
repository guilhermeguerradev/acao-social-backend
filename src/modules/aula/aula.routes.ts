import { Router } from 'express'
import { AulaController } from './aula.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { roleMiddleware } from '../../middlewares/role.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createAulaSchema, updateAulaSchema } from './aula.schema'

const router = Router()
const controller = new AulaController()

router.post('/', authMiddleware, roleMiddleware(['INSTRUTOR']), validate(createAulaSchema), (req, res, next) => controller.create(req, res, next))
router.get('/', authMiddleware, (req, res, next) => controller.findAll(req, res, next))
router.get('/:id', authMiddleware, (req, res, next) => controller.findById(req, res, next))
router.put('/:id', authMiddleware, roleMiddleware(['INSTRUTOR']), validate(updateAulaSchema), (req, res, next) => controller.update(req, res, next))
router.delete('/:id', authMiddleware, roleMiddleware(['INSTRUTOR']), (req, res, next) => controller.delete(req, res, next))

export default router
