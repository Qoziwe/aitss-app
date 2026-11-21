/** The server answered with an error status. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** The request never reached the server (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor(message = 'No connection to the server') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(e: unknown): e is NetworkError {
  return e instanceof NetworkError;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong';
}
