import { Router } from 'express';
import { uploadPropertyImage } from '../../lib/middlewares/upload.multer';
import { propertyImageUploadController } from './create-property/property-images/properties.image.upload.controller';
import { propertyImageDeleteController } from './create-property/property-images/properties.image.delete.controller';
import { setPropertiesMainImageController } from './create-property/property-images/set.properties.main.image.controller';
import { uploadPropertyController } from './create-property/upload-property-form/upload.property.controller';
import { movePropertyImagesController } from './create-property/upload-property-form/move.property.image.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { retrievePropertyListController } from './retrieve-property-list/retrieve.property.list.controller';
import { getPropertyDetailsController } from './retrieve-property-detail/property.detail.controller';

const propertiesRouter = Router();

// POST /api/properties/create-properties/upload-property-images
propertiesRouter.post(
  '/properties/upload-property-images',
  uploadPropertyImage().array('images', 10), // Allow up to 10 images
  propertyImageUploadController,
);

// DELETE /api/properties/images/:imageId (single image) or DELETE /api/properties/images (group by temp_group_id)
propertiesRouter.delete(
  '/properties/images/:imageId',
  propertyImageDeleteController,
);
// DELETE /api/properties/images/:imageId/:temp_group_id
propertiesRouter.delete(
  '/properties/images/:imageId/:temp_group_id',
  propertyImageDeleteController,
);

// PUT /api/properties/images/:imageId/set-main
propertiesRouter.put(
  '/properties/images/:imageId/set-main',
  setPropertiesMainImageController,
);

// POST /api/properties/upload-property
propertiesRouter.post(
  '/properties/upload-property',
  verifyToken,
  uploadPropertyController,
);

// POST /api/properties/move-images/:propertyId
propertiesRouter.put(
  '/properties/move-images/:propertyId',
  verifyToken,
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

export default propertiesRouter;
