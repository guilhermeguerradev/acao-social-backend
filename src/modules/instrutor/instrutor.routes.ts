import { Router } from 'express'
import { InstrutorController } from './instrutor.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createInstrutorSchema, updateInstrutorSchema } from './instrutor.schema'
import { roleMiddleware } from '../../middlewares/role.middleware'

const router = Router()
const controller = new InstrutorController()

router.post('/', authMiddleware, roleMiddleware(['ADMIN']), validate(createInstrutorSchema), (req, res, next) => controller.create(req, res, next))
router.get('/', authMiddleware, (req, res, next) => controller.findAll(req, res, next))
router.get('/:id', authMiddleware, (req, res, next) => controller.findById(req, res, next))
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), validate(updateInstrutorSchema), (req, res, next) => controller.update(req, res, next))
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), (req, res, next) => controller.delete(req, res, next))

export default router
