import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalFileAccessControl } from '../../src/components/settings/LocalFileAccessControl';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('local file access control', () => {
  it('shows the Chrome permission action when file access is blocked', async () => {
    const create = vi.fn(async () => undefined);
    vi.stubGlobal('chrome', {
      runtime: { id: 'paperflow-test' },
      extension: { isAllowedFileSchemeAccess: vi.fn(async () => false) },
      tabs: { create },
    });

    render(<LocalFileAccessControl language="en" />);

    expect(await screen.findByText(/Enable “Allow access to file URLs”/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(create).toHaveBeenCalledWith({
      url: 'chrome://extensions/?id=paperflow-test',
    });
  });

  it('confirms when local PDF access is enabled', async () => {
    vi.stubGlobal('chrome', {
      runtime: { id: 'paperflow-test' },
      extension: { isAllowedFileSchemeAccess: vi.fn(async () => true) },
    });

    render(<LocalFileAccessControl language="en" />);

    expect(await screen.findByText('Ready to open downloaded PDFs automatically.'))
      .toBeVisible();
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
  });
});
