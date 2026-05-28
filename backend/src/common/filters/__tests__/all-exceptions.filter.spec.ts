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

function buildHttpHost(
  method = 'GET',
  url = '/foo',
): { host: ArgumentsHost; response: MockResponse } {
  const response: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const request = { url, method };
  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

function buildRpcHost(): ArgumentsHost {
  return {
    getType: () => 'rpc',
    switchToHttp: () => {
      throw new Error('switchToHttp must not be called for rpc host');
    },
  } as unknown as ArgumentsHost;
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
    const { host, response } = buildHttpHost();
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
    const { host, response } = buildHttpHost();
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
    const { host, response } = buildHttpHost();
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
    const { host, response } = buildHttpHost();
    const err = new Error('stack-leak-check');

    filter.catch(err, host);

    const body = response.json.mock.calls[0][0];
    const serialised = JSON.stringify(body);
    expect(serialised).not.toContain('stack-leak-check');
    expect(serialised).not.toContain(' at ');
    expect(body).not.toHaveProperty('stack');
  });

  it('logs the stack via Logger when not an HttpException', () => {
    const { host } = buildHttpHost('POST', '/bar');
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
    const { host } = buildHttpHost();
    filter.catch(new BadRequestException('nope'), host);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  describe('non-HTTP context (e.g. Telegraf RPC)', () => {
    it('logs the error without attempting to write an HTTP response', () => {
      const host = buildRpcHost();
      const err = new Error('rpc-error');

      expect(() => filter.catch(err, host)).not.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, stack] = errorSpy.mock.calls[0];
      expect(msg).toContain('rpc');
      expect(typeof stack).toBe('string');
      expect(stack).toContain('rpc-error');
    });

    it('does not throw when a non-Error is thrown in a non-HTTP context', () => {
      const host = buildRpcHost();

      expect(() => filter.catch('plain string exception', host)).not.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][1]).toBe('plain string exception');
    });
  });
});
