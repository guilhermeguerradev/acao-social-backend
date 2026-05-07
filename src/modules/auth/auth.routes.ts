import { Router } from 'express'
import { AuthController } from './auth.controller'
import { validate } from '../../middlewares/validate.middleware'
import { loginSchema, registerMedicoSchema, registerInstrutorSchema } from './auth.schema'

const router = Router()
const controller = new AuthController()

router.post('/login', validate(loginSchema), (req, res, next) => controller.login(req, res, next))
router.post('/register/medico', validate(registerMedicoSchema), (req, res, next) => controller.registerMedico(req, res, next))
router.post('/register/instrutor', validate(registerInstrutorSchema), (req, res, next) => controller.registerInstrutor(req, res, next))

export default router
