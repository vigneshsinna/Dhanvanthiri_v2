import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('inserts an image tag from an admin-provided URL and alt text', () => {
    const onChange = vi.fn();
    vi.stubGlobal('prompt', vi.fn()
      .mockReturnValueOnce('/uploads/all/about/brand-story.png')
      .mockReturnValueOnce('Brand story'));
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn((command, _showUi, value) => {
      const editor = document.querySelector('[contenteditable="true"]');
      if (command === 'insertHTML' && editor) {
        editor.innerHTML += String(value);
      }
      return true;
      }),
    });

    render(<RichTextEditor value="" onChange={onChange} />);

    fireEvent.mouseDown(screen.getByTitle('Insert Image'));

    expect(document.execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      '<img src="/uploads/all/about/brand-story.png" alt="Brand story" />'
    );
    expect(onChange).toHaveBeenCalledWith('<img src="/uploads/all/about/brand-story.png" alt="Brand story">');
  });
});
