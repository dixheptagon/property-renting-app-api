interface GetPropertyReportParams {
  tenantId: number;
  propertyId: number;
  roomId?: number;
  selectedDate: Date;
}

interface PropertyReportResponse {
  booked_units: number;
  available_units: number;
  total_units: number;
  occupancy_rate: number;
  selected_date: string;
}

export { GetPropertyReportParams, PropertyReportResponse };
