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
  return (err: any, _req: any, res: any, _next: any) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        success: false,
        error: err.message,
        status: err.status,
      });
    }

    console.error('Unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      status: 500,
    });
  };
}
