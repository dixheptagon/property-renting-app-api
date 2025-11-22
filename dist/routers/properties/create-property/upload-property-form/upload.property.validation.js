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
exports.UploadPropertySchema = void 0;
const Yup = __importStar(require("yup"));
exports.UploadPropertySchema = Yup.object().shape({
    property: Yup.object()
        .shape({
        title: Yup.string().required('Title is required'),
        category: Yup.string()
            .oneOf(['house', 'apartment', 'hotel', 'villa', 'room'])
            .required('Category is required'),
        description: Yup.string().required('Description is required'),
        base_price: Yup.number().min(0).required('Base price is required'),
        address: Yup.string().required('Address is required'),
        city: Yup.string().required('City is required'),
        country: Yup.string().required('Country is required'),
        postal_code: Yup.string().required('Postal code is required'),
        latitude: Yup.number().nullable(),
        longitude: Yup.number().nullable(),
        place_id: Yup.string().nullable(),
        map_url: Yup.string().nullable(),
        amenities: Yup.array().of(Yup.string()).nullable(),
        custom_amenities: Yup.array().of(Yup.string()).nullable(),
        rules: Yup.array().of(Yup.string()).nullable(),
        custom_rules: Yup.array().of(Yup.string()).nullable(),
    })
        .required('Property data is required'),
    propertyImages: Yup.array()
        .of(Yup.object().shape({
        id: Yup.number().required(),
        publicId: Yup.string().required(),
        secureUrl: Yup.string().required(),
        isMain: Yup.boolean().required(),
        orderIndex: Yup.number().required(),
        status: Yup.string()
            .oneOf(['temp', 'draft', 'active', 'deleted'])
            .required(),
        tempGroupId: Yup.string().required(),
    }))
        .required('Property images are required'),
    rooms: Yup.array()
        .of(Yup.object().shape({
        tempId: Yup.string().required(),
        name: Yup.string().required(),
        description: Yup.string().required(),
        base_price: Yup.number().min(0).required(),
        max_guest: Yup.number().min(1).required(),
        total_units: Yup.number().min(1).required(),
        bedrooms: Yup.number().min(0).required(),
        bathrooms: Yup.number().min(0).required(),
        beds: Yup.number().min(0).required(),
        highlight: Yup.array().of(Yup.string()).nullable(),
        custom_highlight: Yup.array().of(Yup.string()).nullable(),
        images: Yup.array()
            .of(Yup.object().shape({
            id: Yup.number().required(),
            publicId: Yup.string().required(),
            secureUrl: Yup.string().required(),
            isMain: Yup.boolean().required(),
            orderIndex: Yup.number().required(),
            status: Yup.string()
                .oneOf(['temp', 'draft', 'active', 'deleted'])
                .required(),
            tempGroupId: Yup.string().required(),
        }))
            .required(),
    }))
        .required('Rooms are required'),
    peakSeasonRates: Yup.array()
        .of(Yup.object().shape({
        tempId: Yup.string().required(),
        targetTempRoomId: Yup.string().required(),
        start_date: Yup.date().required(),
        end_date: Yup.date().required(),
        adjustment_type: Yup.string()
            .oneOf(['percentage', 'nominal'])
            .required(),
        adjustment_value: Yup.number().required(),
    }))
        .nullable(),
    unavailabilities: Yup.array()
        .of(Yup.object().shape({
        tempId: Yup.string().required(),
        targetTempRoomId: Yup.string().required(),
        start_date: Yup.date().required(),
        end_date: Yup.date().required(),
        reason: Yup.string().nullable(),
    }))
        .nullable(),
});
