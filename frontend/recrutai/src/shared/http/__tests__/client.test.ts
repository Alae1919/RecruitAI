import { resolveErrorMessage, ApiError } from '../client';

describe('ApiError', () => {
  test('is an instance of Error', () => {
    const err = new ApiError({ status: 404, code: 'NOT_FOUND', message: 'Not found', fields: null });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  test('sets name to "ApiError"', () => {
    const err = new ApiError({ status: 500, code: 'SERVER', message: 'oops', fields: null });
    expect(err.name).toBe('ApiError');
  });

  test('message is accessible via err.message', () => {
    const err = new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Token expired', fields: null });
    expect(err.message).toBe('Token expired');
  });

  test('status is stored on the instance', () => {
    const err = new ApiError({ status: 422, code: 'VALIDATION', message: 'Invalid', fields: null });
    expect(err.status).toBe(422);
  });

  test('code is stored on the instance', () => {
    const err = new ApiError({ status: 400, code: 'BAD_REQUEST', message: 'Bad', fields: null });
    expect(err.code).toBe('BAD_REQUEST');
  });

  test('fields are null when no field-level errors', () => {
    const err = new ApiError({ status: 500, code: 'SERVER', message: 'err', fields: null });
    expect(err.fields).toBeNull();
  });

  test('stores field-level validation errors', () => {
    const fields = { email: ['Enter a valid email address.'], password: ['Too short.'] };
    const err = new ApiError({ status: 400, code: 'VALIDATION', message: 'Validation failed', fields });
    expect(err.fields).toEqual(fields);
  });

  test('status 0 represents a network / no-response error', () => {
    const err = new ApiError({ status: 0, code: 'UNKNOWN', message: 'Network Error', fields: null });
    expect(err.status).toBe(0);
    expect(err.code).toBe('UNKNOWN');
  });

  // Exhaustive status coverage
  test.each([400, 401, 403, 404, 409, 422, 429, 500, 503])(
    'stores HTTP status %i correctly',
    (status) => {
      const err = new ApiError({ status, code: 'X', message: 'msg', fields: null });
      expect(err.status).toBe(status);
    }
  );
});

describe('resolveErrorMessage', () => {
  test('prefers DRF detail, then message, then the views\' error key', () => {
    expect(resolveErrorMessage({ detail: 'd', message: 'm', error: 'e' })).toBe('d');
    expect(resolveErrorMessage({ message: 'm', error: 'e' })).toBe('m');
    expect(resolveErrorMessage({ error: 'No READY QuestionSet for this job offer.' }))
      .toBe('No READY QuestionSet for this job offer.');
  });

  test('falls back to the transport message, then a generic one', () => {
    expect(resolveErrorMessage(undefined, 'Network Error')).toBe('Network Error');
    expect(resolveErrorMessage({})).toBe('Unknown error');
  });
});
