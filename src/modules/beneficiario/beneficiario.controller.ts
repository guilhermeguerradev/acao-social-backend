import { Request, Response } from "express";
import { BeneficiarioService } from "./beneficiario.service";

const service = new BeneficiarioService();

export class BeneficiarioController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.body);
    return res.status(201).json(result);
  }

  async findAll(_req: Request, res: Response) {
    const result = await service.findAll();
    return res.json(result);
  }

  async findById(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await service.findById(id);
    return res.json(result);
  }

  async delete(req: Request, res: Response) {
    const id = String(req.params.id);
    await service.delete(id);
    return res.status(204).send();
  }
}
