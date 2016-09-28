export class RestError extends Error {
  constructor(httpStatus, code, message) {
    super();
    this.httpStatus = httpStatus;
    this.code = code;
    this.message = message;
  }
}

export class ServerError extends RestError {
  constructor(code = 'server_error', message = 'An internal server problem occurred') {
    super(500, code, message);
  }
}

export class BadRequestError extends RestError {
  constructor(code = 'invalid_request', message = 'The request is missing a '
    + 'required parameter, includes an invalid parameter value, includes a '
    + 'parameter more than once, or is otherwise malformed.') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends RestError {
  constructor(code = 'unauthorized', message = 'Invalid credentials') {
    super(401, code, message);
  }
}

export class ForbiddenError extends RestError {
  constructor(code = 'forbidden', message = 'Insufficient privileges') {
    super(403, code, message);
  }
}

export class NotFoundError extends RestError {
  constructor(code = 'not_found', message = 'Resource not found') {
    super(404, code, message);
  }
}

export class ValidationError extends BadRequestError {
  constructor(path, code, message) {
    super();
    this.errors = [{ code, path, message }];
  }
}

export class ValidationErrors extends BadRequestError {
  constructor(errors) {
    super();
    this.errors = [];
    errors.forEach(({ code, path, message }) => {
      this.errors.push({ code, path, message });
    });
  }
}

/**
 * Logs custom RestErrors and returns the error response as a JSON object.
 */
export function restErrorHandler(log) {
  return (err, req, res, next) => {
    // This function MUST have 4 arguments for it to be recognized as an error
    // handler in express.

    // Check if error is a RestError (don't use `instanceof RestError`; it won't work in some transpilers)
    if (err.httpStatus) {
      const error = {
        error: err.code,
        error_description: err.message,
      };
      if (err.errors) {
        error.error_details = err.errors;
      }

      // Create RestError object representation for log message
      const obj = {
        httpStatus: err.httpStatus,
        code: err.code,
        message: err.message,
        errors: err.errors,
      };

      // Log error
      if (err.httpStatus <= 500) {
        log.info('Client error', obj);
      } else {
        log.error('Server error', obj);
      }
      res.status(err.httpStatus).send(error);
    } else {
      next(err);
    }
  }
}

/**
 * Logs the unexpected errors and returns a 500 code with a JSON error object.
 */
export function unexpectedErrorHandler(log) {
  // This function MUST have 4 arguments for it to be recognized as an error
  // handler in express.
  return (err, req, res, next) => {
    log.error('Server error', err);
    res.status(500).send({
      error: 'unknown_error',
      error_description: err.message,
      error_details: err.stack,
    });
  }
}
