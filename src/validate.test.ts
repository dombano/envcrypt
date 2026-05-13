import { validateEnv, formatValidationReport, ValidationRule } from './validate';
import { EnvMap } from './env';

describe('validateEnv', () => {
  const env: EnvMap = {
    DATABASE_URL: 'postgres://localhost:5432/mydb',
    NODE_ENV: 'production',
    SECRET_KEY: 'supersecret123',
    PORT: '3000',
  };

  it('passes when all required keys are present', () => {
    const rules: ValidationRule[] = [
      { key: 'DATABASE_URL', required: true },
      { key: 'NODE_ENV', required: true },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
    expect(report.results.every((r) => r.valid)).toBe(true);
  });

  it('fails when a required key is missing', () => {
    const rules: ValidationRule[] = [
      { key: 'MISSING_KEY', required: true },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
    expect(report.results[0].errors).toHaveLength(1);
  });

  it('fails when a required key is empty', () => {
    const rules: ValidationRule[] = [{ key: 'EMPTY', required: true }];
    const report = validateEnv({ EMPTY: '' }, rules);
    expect(report.valid).toBe(false);
  });

  it('validates pattern', () => {
    const rules: ValidationRule[] = [
      { key: 'PORT', pattern: /^\d+$/ },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
  });

  it('fails on pattern mismatch', () => {
    const rules: ValidationRule[] = [
      { key: 'NODE_ENV', pattern: /^\d+$/ },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
  });

  it('validates minLength and maxLength', () => {
    const rules: ValidationRule[] = [
      { key: 'SECRET_KEY', minLength: 5, maxLength: 50 },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
  });

  it('fails when value is too short', () => {
    const rules: ValidationRule[] = [{ key: 'PORT', minLength: 10 }];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
  });

  it('validates allowedValues', () => {
    const rules: ValidationRule[] = [
      { key: 'NODE_ENV', allowedValues: ['development', 'production', 'test'] },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(true);
  });

  it('fails when value not in allowedValues', () => {
    const rules: ValidationRule[] = [
      { key: 'NODE_ENV', allowedValues: ['development', 'test'] },
    ];
    const report = validateEnv(env, rules);
    expect(report.valid).toBe(false);
  });
});

describe('formatValidationReport', () => {
  it('returns success message when valid', () => {
    const report = { valid: true, results: [] };
    expect(formatValidationReport(report)).toContain('passed');
  });

  it('returns error lines when invalid', () => {
    const report = {
      valid: false,
      results: [
        { key: 'FOO', valid: false, errors: ['Key "FOO" is required but missing or empty'] },
      ],
    };
    const output = formatValidationReport(report);
    expect(output).toContain('Validation failed');
    expect(output).toContain('FOO');
  });
});
