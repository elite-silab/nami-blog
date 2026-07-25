const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(pageValue?: string, limitValue?: string) {
  const page = pageValue === undefined ? 1 : Number.parseInt(pageValue, 10);
  const limit = limitValue === undefined
    ? DEFAULT_LIMIT
    : Number.parseInt(limitValue, 10);

  if (!Number.isInteger(page) || page < 1) return null;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return null;

  return { page, limit, offset: (page - 1) * limit };
}
