"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const env_1 = __importDefault(require("../../env"));
const snap = new midtrans_client_1.default.Snap({
    isProduction: false,
    serverKey: env_1.default.MIDTRANS_SERVER_KEY,
    clientKey: env_1.default.MIDTRANS_CLIENT_KEY,
});
exports.default = snap;
