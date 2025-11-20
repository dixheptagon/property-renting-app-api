import { Router } from 'express';
import { uploadPropertyImage } from '../../lib/middlewares/upload.multer';
import { propertyImageUploadController } from './create-property/property-images/properties.image.upload.controller';
import { propertyImageDeleteController } from './create-property/property-images/properties.image.delete.controller';
import { setPropertiesMainImageController } from './create-property/property-images/set.properties.main.image.controller';
import { uploadPropertyController } from './create-property/upload-property-form/upload.property.controller';
import { movePropertyImagesController } from './create-property/upload-property-form/move.property.image.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { verifyTenant } from '../../lib/middlewares/verify.role';
import { retrievePropertyListController } from './retrieve-property-list/retrieve.property.list.controller';
import { getPropertyDetailsController } from './retrieve-property-detail/property.detail.controller';
import { getOwnedPropertyIdController } from './get-owned-property-id/get.owned.propery.id.controller';
import { getRoomTypesByPropertyIdController } from './get-room-types-id-by-property-id/get.room.types.controller';

const propertiesRouter = Router();

// POST /api/properties/create-properties/upload-property-images
propertiesRouter.post(
  '/properties/upload-property-images',
  verifyToken,
  verifyTenant,
  uploadPropertyImage().array('images', 10), // Allow up to 10 images
  propertyImageUploadController,
);

// DELETE /api/properties/images/:imageId (single image) or DELETE /api/properties/images (group by temp_group_id)
propertiesRouter.delete(
  '/properties/images/:imageId',
  verifyToken,
  verifyTenant,
  propertyImageDeleteController,
);
// DELETE /api/properties/images/:imageId/:temp_group_id
propertiesRouter.delete(
  '/properties/images/:imageId/:temp_group_id',
  verifyToken,
  verifyTenant,
  propertyImageDeleteController,
);

// PUT /api/properties/images/:imageId/set-main
propertiesRouter.put(
  '/properties/images/:imageId/set-main',
  verifyToken,
  verifyTenant,
  setPropertiesMainImageController,
);

// POST /api/properties/upload-property
propertiesRouter.post(
  '/properties/upload-property',
  verifyToken,
  verifyTenant,
  uploadPropertyController,
);

// POST /api/properties/move-images/:propertyId
propertiesRouter.put(
  '/properties/move-images/:propertyId',
  verifyToken,
  verifyTenant,
  movePropertyImagesController,
);

// GET /api/properties/explore-properties
propertiesRouter.get(
  '/properties/explore-properties',
  retrievePropertyListController,
);

// GET /api/properties/:uid/property-details
propertiesRouter.get(
  '/properties/:uid/property-details',
  getPropertyDetailsController,
);

// GET /api/properties/my-properties
propertiesRouter.get(
  '/properties/my-properties',
  verifyToken,
  verifyTenant,
  getOwnedPropertyIdController,
);

// GET /api/properties/room-types
propertiesRouter.get(
  '/properties/room-types',
  getRoomTypesByPropertyIdController,
);

export default propertiesRouter;
