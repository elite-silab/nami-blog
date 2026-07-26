/**
 * Cloudflare's Response type intentionally returns `unknown` from json().
 * Keep the assertion in one small boundary instead of spreading unsafe casts
 * throughout client components.
 */
export function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export type ApiErrorResult = {
  error?: { message?: string };
};
