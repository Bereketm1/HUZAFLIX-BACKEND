import { PaginatedResponse } from '../dto/paginated.dto';

export const paginate = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): { data: T[]; meta: PaginatedResponse } => {
  const totalPages = Math.ceil(total / limit);
  return { data, meta: new PaginatedResponse(page, totalPages, total) };
};
