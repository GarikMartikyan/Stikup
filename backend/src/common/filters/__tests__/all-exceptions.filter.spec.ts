import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { AllExceptionsFilter } from '../all-exceptions.filter';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

function buildHost(
  method = 'GET',
  url = '/foo',
): { host: ArgumentsHost; response: MockResponse } {
  const response: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const request = { url, method };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {
      // suppress noise
    });
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('forwards HttpException status + string message', () => {
    const { host, response } = buildHost();
    const exception = new HttpException('Boom', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = response.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toBe('Boom');
    expect(body.path).toBe('/foo');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('forwards HttpException status + object-with-message shape (e.g. ValidationPipe)', () => {
    const { host, response } = buildHost();
    const exception = new BadRequestException({
      message: ['field must be a string'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = response.json.mock.calls[0][0];
    expect(body.message).toEqual(['field must be a string']);
  });

  it('returns 500 with "Internal server error" for a thrown plain Error', () => {
    const { host, response } = buildHost();
    const err = new Error('db died');

    filter.catch(err, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = response.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Internal server error');
  });

  it('never serializes the stack into the response body', () => {
    const { host, response } = buildHost();
    const err = new Error('stack-leak-check');

    filter.catch(err, host);

    const body = response.json.mock.calls[0][0];
    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain('stack-leak-check');
    expect(serialised).not.toContain(' at ');
    expect(body).not.toHaveProperty('stack');
  });

  it('logs the stack via Logger when not an HttpException', () => {
    const { host } = buildHost('POST', '/bar');
    const err = new Error('logme');

    filter.catch(err, host);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [msg, stack] = errorSpy.mock.calls[0];
    expect(msg).toContain('POST');
    expect(msg).toContain('/bar');
    expect(typeof stack).toBe('string');
    expect(stack).toContain('logme');
  });

  it('does not log via Logger for HttpException', () => {
    const { host } = buildHost();
    filter.catch(new BadRequestException('nope'), host);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
