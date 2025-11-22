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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrderSchema = void 0;
const Yup = __importStar(require("yup"));
exports.CreateOrderSchema = Yup.object().shape({
    room_id: Yup.number().required('Room ID is required'),
    property_id: Yup.string().required('Property ID is required'),
    check_in_date: Yup.date()
        .required('Check-in date is required')
        .min(new Date(), 'Check-in date cannot be in the past'),
    check_out_date: Yup.date()
        .required('Check-out date is required')
        .min(Yup.ref('check_in_date'), 'Check-out date must be after check-in date'),
    fullname: Yup.string()
        .required('Full name is required')
        .matches(/^[a-zA-Z\s]+$/, 'Full name must only contain letters')
        .min(3, 'Full name is too short'),
    email: Yup.string()
        .email('Invalid email')
        .required('Email is required')
        .max(50, 'Email is too long'),
    phone_number: Yup.string()
        .required('Mobile number is required')
        .matches(/^\+?[0-9]+$/, 'Mobile number must contain only digits')
        .min(7, 'Mobile number must be at least 7 digits')
        .max(15, 'Mobile number must not exceed 15 digits'),
});
