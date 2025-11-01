import * as Yup from 'yup';

export const UploadPropertySchema = Yup.object().shape({
  state: Yup.object()
    .shape({
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
        .of(
          Yup.object().shape({
            id: Yup.number().required(),
            publicId: Yup.string().required(),
            secureUrl: Yup.string().required(),
            isMain: Yup.boolean().required(),
            orderIndex: Yup.number().required(),
            status: Yup.string()
              .oneOf(['temp', 'draft', 'active', 'deleted'])
              .required(),
            tempGroupId: Yup.string().required(),
          }),
        )
        .required('Property images are required'),
      rooms: Yup.array()
        .of(
          Yup.object().shape({
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
              .of(
                Yup.object().shape({
                  id: Yup.number().required(),
                  publicId: Yup.string().required(),
                  secureUrl: Yup.string().required(),
                  isMain: Yup.boolean().required(),
                  orderIndex: Yup.number().required(),
                  status: Yup.string()
                    .oneOf(['temp', 'draft', 'active', 'deleted'])
                    .required(),
                  tempGroupId: Yup.string().required(),
                }),
              )
              .required(),
          }),
        )
        .required('Rooms are required'),
      peakSeasonRates: Yup.array()
        .of(
          Yup.object().shape({
            tempId: Yup.string().required(),
            targetTempRoomId: Yup.string().required(),
            start_date: Yup.date().required(),
            end_date: Yup.date().required(),
            adjustment_type: Yup.string()
              .oneOf(['percentage', 'nominal'])
              .required(),
            adjustment_value: Yup.number().required(),
          }),
        )
        .required(),
      unavailabilities: Yup.array()
        .of(
          Yup.object().shape({
            tempId: Yup.string().required(),
            targetTempRoomId: Yup.string().required(),
            start_date: Yup.date().required(),
            end_date: Yup.date().required(),
            reason: Yup.string().nullable(),
          }),
        )
        .required(),
    })
    .required('State is required'),
  version: Yup.number().required(),
});
