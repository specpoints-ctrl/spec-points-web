export class AppError extends Error {
  public status: number;

  constructor(message: string, status: number = 500, originalError?: any) {
    super(message);
    this.status = status;

    if (originalError) {
      console.error('Original error:', originalError);
    }
  }
}

export function createErrorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        error: err.message,
        status: err.status,
      });
    }

    console.error('Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      status: 500,
    });
  };
}
