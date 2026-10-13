import { expect, test } from '@playwright/test';

test('shows Chrome file permission guidance for a blocked local PDF URL', async ({ page }) => {
  const localPdf = 'file:///Users/researcher/Downloads/paper.pdf';
  await page.goto(`/reader.html?url=${encodeURIComponent(localPdf)}`);

  await expect(page.getByText(
    'Chrome is blocking local files. Open extension settings and enable “Allow access to file URLs”.',
  )).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open extension settings' })).toBeVisible();
  await expect(page.getByPlaceholder('https://example.org/paper.pdf')).toHaveValue(localPdf);
});
