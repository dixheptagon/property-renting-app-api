interface GetOrderListParams {
  tenantId: number;
  status?: string[];
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: string;
}

interface OrderListResponse {
  data: {
    orderId: string;
    status: string;
    check_in_date: Date;
    check_out_date: Date;
    total_price: number;
    property: {
      name: string;
      address: string;
      city: string;
    };
    room: {
      name: string;
      description: string;
    };
    user: {
      name: string;
      email: string;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export { GetOrderListParams, OrderListResponse };
