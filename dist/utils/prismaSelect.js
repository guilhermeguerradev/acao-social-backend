"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beneficiarioSelect = exports.instrutorWithUserSelect = exports.medicoWithUserSelect = exports.roleUserSelect = exports.publicUserSelect = void 0;
exports.publicUserSelect = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
};
exports.roleUserSelect = {
    id: true,
    name: true,
    email: true,
};
exports.medicoWithUserSelect = {
    id: true,
    userId: true,
    user: {
        select: exports.roleUserSelect,
    },
};
exports.instrutorWithUserSelect = {
    id: true,
    userId: true,
    user: {
        select: exports.roleUserSelect,
    },
};
exports.beneficiarioSelect = {
    id: true,
    name: true,
    telefone: true,
    createdAt: true,
};
