import { Router } from 'express';
import { uploadPropertyImage } from '../../lib/middlewares/upload.multer';
import { propertyImageUploadController } from './create-property/property-images/properties.image.upload.controller';
import { propertyImageDeleteController } from './create-property/property-images/properties.image.delete.controller';

const propertiesRouter = Router();

// POST /api/properties/create-properties/temp-images
propertiesRouter.post(
  '/properties/upload-property-images',
  uploadPropertyImage().array('images', 10), // Allow up to 10 images
  propertyImageUploadController,
);

// DELETE /api/properties/images/:imageId
propertiesRouter.delete(
  '/properties/images/:imageId',
  propertyImageDeleteController,
);

export default propertiesRouter;
