"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demandOptions = exports.demandConsent = exports.demandReturnPreferences = exports.demandCategories = void 0;
exports.demandCategories = [
    { value: 'FOOD', label: 'Alimentos ou cesta básica' },
    { value: 'CLOTHING', label: 'Roupas e calçados' },
    { value: 'HYGIENE', label: 'Produtos de higiene pessoal' },
    { value: 'HEALTH', label: 'Medicamentos ou apoio relacionado à saúde' },
    { value: 'EDUCATION', label: 'Apoio educacional' },
    { value: 'SOCIAL_ASSISTANCE', label: 'Orientação ou assistência social' },
    { value: 'OTHER', label: 'Outros' },
];
exports.demandReturnPreferences = [
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'PHONE_CALL', label: 'Ligação telefônica' },
];
exports.demandConsent = {
    version: 'contact-v1',
    text: 'Autorizo o uso dos dados informados para análise e contato sobre esta solicitação.',
};
exports.demandOptions = {
    categories: exports.demandCategories,
    returnPreferences: exports.demandReturnPreferences,
    consent: exports.demandConsent,
};
