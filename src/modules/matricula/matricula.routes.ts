import { Router } from 'express'
import { MatriculaController } from './matricula.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { createMatriculaSchema, updateMatriculaSchema } from './matricula.schema'

const router = Router()
const controller = new MatriculaController()

router.post('/', authMiddleware, validate(createMatriculaSchema), (req, res, next) => controller.create(req, res, next))
router.get('/', authMiddleware, (req, res, next) => controller.findAll(req, res, next))
router.get('/:id', authMiddleware, (req, res, next) => controller.findById(req, res, next))
router.put('/:id', authMiddleware, validate(updateMatriculaSchema), (req, res, next) => controller.update(req, res, next))
router.delete('/:id', authMiddleware, (req, res, next) => controller.delete(req, res, next))

export default router
