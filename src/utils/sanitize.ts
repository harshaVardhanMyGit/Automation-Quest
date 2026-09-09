const sensitiveKeyPattern = /(authorization|cookie|set-cookie|password|passwd|secret|token|api[_-]?key|client[_-]?secret|refresh[_-]?token)\s*[:=]\s*[^\s,;"']+/gi;
const bearerPattern = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function sanitizeForAI(value: string, maxLength = 12000): string {
  const sanitized = value
    .replace(bearerPattern, 'Bearer [REDACTED]')
    .replace(sensitiveKeyPattern, (match) => `${match.split(/[:=]/, 1)[0]}=[REDACTED]`)
    .replace(emailPattern, '[REDACTED_EMAIL]');

  if (sanitized.length <= maxLength) return sanitized;
  return `${sanitized.slice(0, maxLength)}\n[TRUNCATED]`;
}