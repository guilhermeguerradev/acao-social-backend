import { Request, Response } from "express";
import { BeneficiarioService } from "./beneficiario.service";

const service = new BeneficiarioService();

export class BeneficiarioController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.body);
    return res.status(201).json(result);
  }

  async findAll(req: Request, res: Response) {
    const result = await service.findAll(req.query);
    return res.json(result);
  }

  async findById(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await service.findById(id);
    return res.json(result);
  }

  async update(req: Request, res: Response) {
    const result = await service.update(String(req.params.id), req.body);
    return res.json(result);
  }

  async delete(req: Request, res: Response) {
    const id = String(req.params.id);
    await service.delete(id);
    return res.status(204).send();
  }
}
