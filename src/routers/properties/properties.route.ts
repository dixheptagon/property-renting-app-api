import { Router } from 'express';
import { uploadPropertyImage } from '../../lib/middlewares/upload.multer';
import { propertyImageUploadController } from './create-property/property-images/properties.image.upload.controller';
import { propertyImageDeleteController } from './create-property/property-images/properties.image.delete.controller';
import { setPropertiesMainImageController } from './create-property/property-images/set.properties.main.image.controller';
import { uploadPropertyController } from './create-property/upload-property-form/upload.property.controller';
import { movePropertyImagesController } from './create-property/upload-property-form/move.property.image.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';

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

export default propertiesRouter;
