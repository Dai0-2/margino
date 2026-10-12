import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatActions } from '../../src/hooks/useChatActions';
import { useAppStore } from '../../src/store/useAppStore';

const mocks = vi.hoisted(() => ({
  sendToCodex: vi.fn(),
  sendToOpenAI: vi.fn(),
}));

vi.mock('../../src/services/bridge', () => ({
  sendToCodex: mocks.sendToCodex,
  sendToOpenAI: mocks.sendToOpenAI,
}));

describe('quoted assistant answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendToOpenAI.mockResolvedValue({ ok: true, answer: 'A focused answer.' });
    useAppStore.setState({
      providerMode: 'api',
      apiState: 'connected',
      model: 'gpt-4.1-mini',
      uiLanguage: 'en',
      promptLanguage: 'auto',
      messages: [{
        id: 'assistant:source',
        role: 'assistant',
        content: 'The source answer contains a specific claim.',
      }],
      quotedReply: {
        messageId: 'assistant:source',
        text: 'a specific claim',
      },
      attachments: [],
      paper: null,
      paperChunks: [],
      activeThreadId: null,
      sending: false,
      draft: 'Why is that?',
    });
  });

  it('persists the quote on the user message and adds it to model context', async () => {
    const { result } = renderHook(() => useChatActions());

    await act(async () => {
      await result.current.submit('Why is that?');
    });

    const userMessage = useAppStore.getState().messages.find((message) => message.role === 'user');
    expect(userMessage).toMatchObject({
      content: 'Why is that?',
      quotedMessageId: 'assistant:source',
      quotedText: 'a specific claim',
    });
    expect(mocks.sendToOpenAI).toHaveBeenCalledOnce();
    expect(mocks.sendToOpenAI.mock.calls[0]?.[1]).toContain(
      'SELECTED ASSISTANT ANSWER\n' +
      'a specific claim',
    );
    expect(useAppStore.getState().quotedReply).toBeNull();
  });
});
