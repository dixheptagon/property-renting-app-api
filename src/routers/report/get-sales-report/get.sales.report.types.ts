interface GetSalesReportParams {
  tenantId: number;
  propertyId: number;
  startDate: Date;
  endDate: Date;
}

interface SalesReportPeriod {
  period: string;
  completed: number;
  cancelled: number;
}

interface SalesReportResponse {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  periods: SalesReportPeriod[];
  startDate: string;
  endDate: string;
}

export { GetSalesReportParams, SalesReportResponse, SalesReportPeriod };
