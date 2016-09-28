# yahapi-errors

A set of error classes and [Connect](https://github.com/senchalabs/connect) error handlers to be used in a REST service.

# Install

```
$ npm install --save @yahapi/errors
```

# Usage

## Errors

The following errors classes are available:

Class name        | HTTP | Code         | Error message
------------------|------|--------------|------------------------------------------
ServerError       |  500 | server_error | An internal server problem occurred
BadRequestError   |  400 | bad_request  | One or more validation errors were found
UnauthorizedError |  401 | unauthorized | Invalid credentials
ForbiddenError    |  403 | forbidden    | Insufficient privileges
NotFoundError     |  404 | not_found    | Resource not found
ValidationError   |  400 | bad_request  | One or more validation errors were found
ValidationErrors  |  400 | bad_request  | One or more validation errors were found

**Changing error code/message**

Change the error message and code as follows:

```js
import { BadRequestError } from '@yahapi/errors';

throw new BadRequestError('custom_code', 'Custom error message');
throw new BadRequestError(undefined, 'Use undefined to keep default error code');
```

**Custom error class**

When changing the error code consider creating a subclass instead:

```js
import { BadRequestError } from '@yahapi/errors';

export class SyntaxError extends BadRequestError {
  constructor() {
    super('invalid_syntax', 'The message body is malformed');
  }
}
```

**Validation errors**

Validation errors extend `BadRequestError`s and add additional error details for the client .

```js
import {
  ValidationError,
  ValidationErrors,
} from '@yahapi/errors';

/*
{
  httpStatus: 400,
  code: 'bad_request',
  message: 'One or more validation errors were found',
  errors: [{ path: '/metric_id', code: 'not_found', message: 'metric not found' }],
}
*/
throw new ValidationError('/metric_id', 'not_found', 'metric not found');
throw new ValidationErrors([
  { path: '/name', code: 'min_length', message: 'must have at least 5 characters' },
  { path: '/description', code: 'required', message: 'is required' },
]);
```

## Middleware error handlers

The error middleware handler of this package transforms `RestError`s to the following error response format:

```json
{
  "error": "not_found",
  "error_description": "Resource not found",
  "error_details": [{
    "code": "min_length",
    "path": "/name",
    "message": "must have at least 5 characters"
  }]
}
```

This format is similar to the [OAuth2 Error syntax](https://tools.ietf.org/html/rfc6749#section-4.1.2.1).

You can use the error handlers like this:

```js
import express from 'express';
import {
  ValidationErrors
  restErrorHandler,
  unexpectedErrorHandler,
} from '@yahapi/errors';

var app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/validation_error', (req, res) => {
  throw new ValidationErrors([
    { path: '/name', code: 'min_length', message: 'must have at least 5 characters' },
    { path: '/description', code: 'required', message: 'is required' },
  ]);
});

app.get('/unexpected_error', (req, res) => {
  throw new Error('Something happened');
});

const logger = {
  info: (msg, object) => console.log(msg, object),
  error: (msg, object) => console.err(msg, object),
}

app.use(restErrorHandler(logger));
app.use(unexpectedErrorHandler(logger));

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
```
