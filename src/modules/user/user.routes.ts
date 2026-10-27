import { Router } from 'express'
import { UserController } from './user.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createUserSchema, updateUserSchema, promoteAdminSchema } from './user.schema'
import { roleMiddleware } from '../../middlewares/role.middleware'

const router = Router()
const controller = new UserController()

router.use(authMiddleware)
// Updating one's own account does not grant access to user administration.
router.put('/me', validate(updateUserSchema), (req, res, next) => controller.updateMe(req, res, next))
router.use(roleMiddleware(['ADMIN']))
router.post('/', validate(createUserSchema), (req, res, next) => controller.create(req, res, next))
router.get('/', (req, res, next) => controller.findAll(req, res, next))
router.post('/:id/promote-admin', validate(promoteAdminSchema), (req, res, next) => controller.promoteAdmin(req, res, next))
router.get('/:id', (req, res, next) => controller.findById(req, res, next))
router.put('/:id', validate(updateUserSchema), (req, res, next) => controller.update(req, res, next))
router.delete('/:id', (req, res, next) => controller.delete(req, res, next))

export default router
