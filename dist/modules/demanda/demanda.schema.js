"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandIdSchema = exports.createDemandSchema = void 0;
const zod_1 = require("zod");
const demanda_options_1 = require("./demanda.options");
const phoneSchema = zod_1.z.string().trim()
    .regex(/^\+?[\d\s().-]+$/, 'Informe um telefone brasileiro com DDD')
    .transform(value => {
    const digits = value.replace(/\D/g, '');
    return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? digits.slice(2) : digits;
})
    .refine(value => /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(value), 'Informe um telefone brasileiro válido com DDD');
exports.createDemandSchema = zod_1.z.object({
    description: zod_1.z.string().trim().min(1).max(2000),
    requestKey: zod_1.z.string().uuid(),
    phone: phoneSchema,
    neighborhood: zod_1.z.string().trim().min(1).max(120),
    returnPreference: zod_1.z.enum(demanda_options_1.demandReturnPreferences.map(option => option.value)),
    category: zod_1.z.enum(demanda_options_1.demandCategories.map(option => option.value)),
    otherDescription: zod_1.z.string().trim().max(200).nullish(),
    urgent: zod_1.z.boolean(),
    contactConsent: zod_1.z.literal(true, { error: 'É necessário autorizar o contato para enviar a solicitação' }),
}).strict().superRefine((data, context) => {
    if (data.category === 'OTHER' && !data.otherDescription) {
        context.addIssue({ code: 'custom', path: ['otherDescription'], message: 'Especifique o pedido ao selecionar Outros' });
    }
}).transform(data => ({ ...data, otherDescription: data.category === 'OTHER' ? data.otherDescription : null }));
exports.demandIdSchema = zod_1.z.string().uuid();
