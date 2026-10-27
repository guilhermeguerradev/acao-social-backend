import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { DemandController } from './demanda.controller'
import { createDemandSchema } from './demanda.schema'
import { demandOptions } from './demanda.options'

const router = Router()
const controller = new DemandController()

router.use(authMiddleware)
router.post('/', validate(createDemandSchema), controller.create)
router.get('/', controller.findAll)
router.get('/options', (_req, res) => res.json(demandOptions))
router.get('/:id', controller.findById)

export default router
