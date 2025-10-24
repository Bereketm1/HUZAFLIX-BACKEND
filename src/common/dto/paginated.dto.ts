export class PaginatedResponse {
  page: number;
  totalPages: number;
  totalItems: number;

  constructor(page: number, totalPages: number, totalItems: number) {
    this.page = page;
    this.totalPages = totalPages;
    this.totalItems = totalItems;
  }
}
