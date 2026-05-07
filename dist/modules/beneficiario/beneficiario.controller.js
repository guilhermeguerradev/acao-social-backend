"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiarioController = void 0;
const beneficiario_service_1 = require("./beneficiario.service");
const service = new beneficiario_service_1.BeneficiarioService();
class BeneficiarioController {
    async create(req, res) {
        const result = await service.create(req.body);
        return res.status(201).json(result);
    }
    async findAll(_req, res) {
        const result = await service.findAll();
        return res.json(result);
    }
    async findById(req, res) {
        const id = String(req.params.id);
        const result = await service.findById(id);
        return res.json(result);
    }
    async delete(req, res) {
        const id = String(req.params.id);
        await service.delete(id);
        return res.status(204).send();
    }
}
exports.BeneficiarioController = BeneficiarioController;
