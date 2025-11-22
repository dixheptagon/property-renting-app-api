"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Yup = __importStar(require("yup"));
// config dotenv
dotenv_1.default.config();
// create schema for validation
const schema = Yup.object().shape({
    PORT: Yup.number().default(2000).required(),
    NODE_ENV: Yup.string().default('development').required(),
    LOCAL_DIRECT_URL: Yup.string().required('DIRECT_URL is required'),
    JWT_ACCESS_SECRET: Yup.string().required('ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: Yup.string().required('REFRESH_SECRET is required'),
    DATABASE_URL: Yup.string().required('DATABASE_URL is required'),
    SUPABASE_DIRECT_URL: Yup.string().required('SUPABASE_DIRECT_URL is required'),
    DOMAIN_URL: Yup.string().required('DOMAIN_URL is required'),
    ACTIVATION_ACCOUNT_URL: Yup.string().required('ACTIVATION_ACCOUNT_URL is required'),
    NODEMAILER_APP_EMAIL: Yup.string().required('NODEMAILER_APP_EMAIL is required'),
    NODEMAILER_APP_PASSWORD: Yup.string().required('NODEMAILER_APP_PASSWORD is required'),
    CLOUD_NAME: Yup.string().required('CLOUD_NAME is required'),
    CLOUD_API_KEY: Yup.string().required('CLOUD_API_KEY is required'),
    CLOUD_API_SECRET: Yup.string().required('CLOUD_API_SECRET is required'),
    // CLOUD_EVENT_IMAGE_FOLDER_PATH: Yup.string().required(
    //   'CLOUD_EVENT_IMAGE_FOLDER_PATH is required',
    // ),
    CLOUD_PAYMENT_PROOF_FOLDER_PATH: Yup.string().required('CLOUD_PAYMENT_PROOF_FOLDER_PATH is required'),
    CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH: Yup.string().required('CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH is required'),
    CLOUD_TENANT_PROFILE_FOLDER_PATH: Yup.string().required('CLOUD_TENANT_PROFILE_FOLDER_PATH is required'),
    MIDTRANS_SERVER_KEY: Yup.string().required('MIDTRANS_SERVER_KEY is required'),
    MIDTRANS_CLIENT_KEY: Yup.string().required('MIDTRANS_CLIENT_KEY is required'),
});
// validate config
try {
    schema.validateSync(process.env, { abortEarly: false });
}
catch (error) {
    console.error('Invalid config:', error.errors);
    process.exit(1);
}
// load config
const loadConfig = () => {
    return schema.cast(process.env);
};
// export config
exports.default = Object.freeze(Object.assign({}, loadConfig()));
