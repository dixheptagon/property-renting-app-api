import { Router } from 'express';
import { uploadPropertyImage } from '../../lib/middlewares/upload.multer';
import { propertyImageUploadController } from './create-property/property-images/properties.image.upload.controller';
import { propertyImageDeleteController } from './create-property/property-images/properties.image.delete.controller';
import { setPropertiesMainImageController } from './create-property/property-images/set.properties.main.image.controller';

const propertiesRouter = Router();

// POST /api/properties/create-properties/temp-images
propertiesRouter.post(
  '/properties/upload-property-images',
  uploadPropertyImage().array('images', 10), // Allow up to 10 images
  propertyImageUploadController,
);

// DELETE /api/properties/images/:imageId (single image) or DELETE /api/properties/images (group by temp_group_id)
propertiesRouter.delete(
  '/properties/images/:imageId?',
  propertyImageDeleteController,
);

// PUT /api/properties/images/:imageId/set-main
propertiesRouter.put(
  '/properties/images/:imageId/set-main',
  setPropertiesMainImageController,
);

export default propertiesRouter;
