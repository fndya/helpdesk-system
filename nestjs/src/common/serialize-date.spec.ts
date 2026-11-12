import { serializeDate } from './serialize-date.js';

describe('serializeDate', () => {
    it('matches Laravel UTC JSON timestamp precision', () => {
        expect(serializeDate(new Date('2026-01-01T00:00:00.123Z'))).toBe(
            '2026-01-01T00:00:00.123000Z',
        );
        expect(serializeDate(null)).toBeNull();
    });
});
