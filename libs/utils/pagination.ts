export type PaginationParams = { page?: number; pageSize?: number; limit?: number; skip?: number };

export const getPagination = (params: PaginationParams) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const limit = params.limit && params.limit > 0 ? params.limit : pageSize;
  const skip = typeof params.skip === 'number' && params.skip >= 0 ? params.skip : (page - 1) * limit;
  return { page, pageSize, limit, skip };
};

export const buildPaginationResponse = <T>(data: T[], meta: { page: number; pageSize: number; limit: number; skip: number }, total: number, message: string) => {
  const safeLimit = meta.limit > 0 ? meta.limit : 1;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    success: true,
    message,
    data,
    part: total,
    page: meta.page,
    pageSize: meta.pageSize,
    limit: meta.limit,
    skip: meta.skip,
    totalPages,
  };
};
