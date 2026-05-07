import { Router } from "express";
import { BeneficiarioController } from "./beneficiario.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createBeneficiarioSchema } from "./beneficiario.schema";

const router = Router();
const controller = new BeneficiarioController();

router.use(authMiddleware);
router.post("/", validate(createBeneficiarioSchema), controller.create);
router.get("/", controller.findAll);
router.get("/:id", controller.findById);
router.delete("/:id", controller.delete);

export default router;
