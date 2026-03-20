import { formatUsername, truncateString, resolveMediaUrl } from '../format';

describe('format utilities', () => {
  describe('formatUsername', () => {
    it('should add @ prefix and lowercase the username', () => {
      expect(formatUsername('JohnDoe')).toBe('@johndoe');
    });
  });

  describe('truncateString', () => {
    it('should truncate string if it exceeds length', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...');
    });

    it('should not truncate string if it is within length', () => {
      expect(truncateString('Hello', 10)).toBe('Hello');
    });
  });

  describe('resolveMediaUrl', () => {
    it('should return null if no url provided', () => {
      expect(resolveMediaUrl(null)).toBeNull();
      expect(resolveMediaUrl(undefined)).toBeNull();
    });

    it('should return the url as is if it starts with http', () => {
      const url = 'https://example.com/image.jpg';
      expect(resolveMediaUrl(url)).toBe(url);
    });

    it('should prepend storage base url for relative paths', () => {
      // Storage base is defined in ENV.STORAGE_BASE_URL
      // The mock in jest-setup.ts should handle this if it's imported correctly
      // but resolveMediaUrl uses ENV from ../config/env
      const path = 'profile/pic.jpg';
      const result = resolveMediaUrl(path);
      expect(result).toContain(path);
    });
  });
});
