// Mock dependencies that trigger axios/ESM imports — the reducer itself is pure.
jest.mock('../../api/interviews', () => ({ sendVideo: jest.fn() }));
jest.mock('../useVideoRecorder', () => ({ useVideoRecorder: jest.fn(() => ({ start: jest.fn(), stopAndGetBlob: jest.fn(), teardown: jest.fn() })) }));

import { reducer, INITIAL_STATE } from '../useInterviewMachine';

describe('interview machine reducer', () => {
  test('IDLE is the initial state', () => {
    expect(INITIAL_STATE).toEqual({ status: 'IDLE', qIdx: -1, error: null });
  });

  test('START transitions IDLE → RECORDING at qIdx 0', () => {
    const next = reducer(INITIAL_STATE, { type: 'START' });
    expect(next.status).toBe('RECORDING');
    expect(next.qIdx).toBe(0);
    expect(next.error).toBeNull();
  });

  test('SUBMITTING transitions RECORDING → SUBMITTING', () => {
    const recording = { ...INITIAL_STATE, status: 'RECORDING', qIdx: 0 };
    const next = reducer(recording, { type: 'SUBMITTING' });
    expect(next.status).toBe('SUBMITTING');
    expect(next.qIdx).toBe(0);
  });

  test('NEXT advances qIdx and returns to RECORDING', () => {
    const submitting = { ...INITIAL_STATE, status: 'SUBMITTING', qIdx: 0 };
    const next = reducer(submitting, { type: 'NEXT' });
    expect(next.status).toBe('RECORDING');
    expect(next.qIdx).toBe(1);
    expect(next.error).toBeNull();
  });

  test('DONE marks interview as complete', () => {
    const submitting = { ...INITIAL_STATE, status: 'SUBMITTING', qIdx: 2 };
    const next = reducer(submitting, { type: 'DONE' });
    expect(next.status).toBe('DONE');
  });

  test('ERROR records error message and sets ERROR status', () => {
    const recording = { ...INITIAL_STATE, status: 'RECORDING', qIdx: 1 };
    const next = reducer(recording, { type: 'ERROR', error: 'Upload failed' });
    expect(next.status).toBe('ERROR');
    expect(next.error).toBe('Upload failed');
  });

  test('unknown event returns state unchanged (identity)', () => {
    const state = { ...INITIAL_STATE };
    expect(reducer(state, { type: 'NOOP' })).toBe(state);
  });

  // Property-style: NEXT always increments qIdx by exactly 1
  test.each([0, 1, 2, 5, 99])(
    'NEXT increments qIdx by 1 regardless of starting index (qIdx=%i)',
    (qIdx) => {
      const state = { status: 'SUBMITTING', qIdx, error: null };
      expect(reducer(state, { type: 'NEXT' }).qIdx).toBe(qIdx + 1);
    }
  );

  // Property-style: START always resets to qIdx 0 and clears error
  test.each(['IDLE', 'ERROR', 'DONE'])(
    'START from %s always resets to RECORDING at qIdx 0 with no error',
    (status) => {
      const state = { status, qIdx: 3, error: 'some error' };
      const next = reducer(state, { type: 'START' });
      expect(next).toMatchObject({ status: 'RECORDING', qIdx: 0, error: null });
    }
  );
});
