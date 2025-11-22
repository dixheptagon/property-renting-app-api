"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./env"));
// start the server
app_1.default.listen(env_1.default.PORT, () => {
    console.log(`[⚡SERVER ] Server is running at http://localhost:${env_1.default.PORT} in ${env_1.default.NODE_ENV} mode`);
});
