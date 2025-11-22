"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_multer_1 = require("../../lib/middlewares/upload.multer");
const properties_image_upload_controller_1 = require("./create-property/property-images/properties.image.upload.controller");
const properties_image_delete_controller_1 = require("./create-property/property-images/properties.image.delete.controller");
const set_properties_main_image_controller_1 = require("./create-property/property-images/set.properties.main.image.controller");
const upload_property_controller_1 = require("./create-property/upload-property-form/upload.property.controller");
const move_property_image_controller_1 = require("./create-property/upload-property-form/move.property.image.controller");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const verify_role_1 = require("../../lib/middlewares/verify.role");
const retrieve_property_list_controller_1 = require("./retrieve-property-list/retrieve.property.list.controller");
const property_detail_controller_1 = require("./retrieve-property-detail/property.detail.controller");
const get_owned_propery_id_controller_1 = require("./get-owned-property-id/get.owned.propery.id.controller");
const get_room_types_controller_1 = require("./get-room-types-id-by-property-id/get.room.types.controller");
const propertiesRouter = (0, express_1.Router)();
// POST /api/properties/create-properties/upload-property-images
propertiesRouter.post('/properties/upload-property-images', verify_token_1.verifyToken, verify_role_1.verifyTenant, (0, upload_multer_1.uploadPropertyImage)().array('images', 10), // Allow up to 10 images
properties_image_upload_controller_1.propertyImageUploadController);
// DELETE /api/properties/images/:imageId (single image) or DELETE /api/properties/images (group by temp_group_id)
propertiesRouter.delete('/properties/images/:imageId', verify_token_1.verifyToken, verify_role_1.verifyTenant, properties_image_delete_controller_1.propertyImageDeleteController);
// DELETE /api/properties/images/:imageId/:temp_group_id
propertiesRouter.delete('/properties/images/:imageId/:temp_group_id', verify_token_1.verifyToken, verify_role_1.verifyTenant, properties_image_delete_controller_1.propertyImageDeleteController);
// PUT /api/properties/images/:imageId/set-main
propertiesRouter.put('/properties/images/:imageId/set-main', verify_token_1.verifyToken, verify_role_1.verifyTenant, set_properties_main_image_controller_1.setPropertiesMainImageController);
// POST /api/properties/upload-property
propertiesRouter.post('/properties/upload-property', verify_token_1.verifyToken, verify_role_1.verifyTenant, upload_property_controller_1.uploadPropertyController);
// POST /api/properties/move-images/:propertyId
propertiesRouter.put('/properties/move-images/:propertyId', verify_token_1.verifyToken, verify_role_1.verifyTenant, move_property_image_controller_1.movePropertyImagesController);
// GET /api/properties/explore-properties
propertiesRouter.get('/properties/explore-properties', retrieve_property_list_controller_1.retrievePropertyListController);
// GET /api/properties/:uid/property-details
propertiesRouter.get('/properties/:uid/property-details', property_detail_controller_1.getPropertyDetailsController);
// GET /api/properties/my-properties
propertiesRouter.get('/properties/my-properties', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_owned_propery_id_controller_1.getOwnedPropertyIdController);
// GET /api/properties/room-types
propertiesRouter.get('/properties/room-types', get_room_types_controller_1.getRoomTypesByPropertyIdController);
exports.default = propertiesRouter;
