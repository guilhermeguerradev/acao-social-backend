import { Router } from 'express'
import { UserController } from './user.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createUserSchema, updateUserSchema } from './user.schema'
import { roleMiddleware } from '../../middlewares/role.middleware'

const router = Router()
const controller = new UserController()

router.post('/', validate(createUserSchema), (req, res, next) => controller.create(req, res, next))
router.get('/', authMiddleware, roleMiddleware(['MEDICO', 'INSTRUTOR']), (req, res, next) => controller.findAll(req, res, next))
router.get('/:id', authMiddleware, roleMiddleware(['MEDICO', 'INSTRUTOR']), (req, res, next) => controller.findById(req, res, next))
router.put('/:id', authMiddleware, roleMiddleware(['MEDICO', 'INSTRUTOR']), validate(updateUserSchema), (req, res, next) => controller.update(req, res, next))
router.delete('/:id', authMiddleware, roleMiddleware(['MEDICO', 'INSTRUTOR']), (req, res, next) => controller.delete(req, res, next))

export default router
