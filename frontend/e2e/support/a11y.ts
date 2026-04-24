import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function expectNoCriticalA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''));
  expect(critical, formatViolations(critical)).toEqual([]);
}

function formatViolations(violations: any[]) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => node.target.join(', ')).join('; ');
      return `${violation.id}: ${violation.help} (${nodes})`;
    })
    .join('\n');
}
