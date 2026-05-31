// Mock the openai module before importing anything that uses it.
// The `__esModule: true` flag is required so Jest treats `default` as the
// default export rather than wrapping it in a module object.
const mockEdit = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    images: { edit: mockEdit },
  })),
  toFile: jest.fn((buf: Buffer, name: string) =>
    Promise.resolve({ buf, name }),
  ),
}));

// Mock sharp so tests don't need native binaries.
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-png')),
  })),
}));

import { OpenAIImageProvider } from '../openai-image-provider';

const BASE64_SMALL = Buffer.from('fake-result').toString('base64');

const FAKE_CONFIG = {
  apiKey: 'sk-test',
  model: 'gpt-image-1',
  size: '1024x1024',
};

describe('OpenAIImageProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEdit.mockResolvedValue({
      data: [{ b64_json: BASE64_SMALL }],
    });
  });

  it('throws when sourceImage is empty', async () => {
    const provider = new OpenAIImageProvider(FAKE_CONFIG);
    await expect(provider.generate(Buffer.alloc(0), 'prompt')).rejects.toThrow(
      'openai provider: empty source image',
    );
  });

  it('calls images.edit with the configured model and size', async () => {
    const provider = new OpenAIImageProvider(FAKE_CONFIG);
    const sourceImage = Buffer.from('valid-image-bytes');

    await provider.generate(sourceImage, 'make stickers');

    expect(mockEdit).toHaveBeenCalledTimes(1);
    const callArgs = mockEdit.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.model).toBe('gpt-image-1');
    expect(callArgs.size).toBe('1024x1024');
    expect(callArgs.prompt).toBe('make stickers');
  });

  it('returns the decoded Buffer from b64_json', async () => {
    const provider = new OpenAIImageProvider(FAKE_CONFIG);
    const result = await provider.generate(
      Buffer.from('valid-image'),
      'prompt',
    );

    expect(result).toEqual(Buffer.from('fake-result'));
  });

  it('throws when b64_json is missing from the response', async () => {
    mockEdit.mockResolvedValueOnce({ data: [{}] });

    const provider = new OpenAIImageProvider(FAKE_CONFIG);
    await expect(
      provider.generate(Buffer.from('valid-image'), 'prompt'),
    ).rejects.toThrow('openai provider: response missing b64_json');
  });

  it('wraps API errors with a descriptive message', async () => {
    mockEdit.mockRejectedValueOnce(new Error('429 Too Many Requests'));

    const provider = new OpenAIImageProvider(FAKE_CONFIG);
    await expect(
      provider.generate(Buffer.from('valid-image'), 'prompt'),
    ).rejects.toThrow(
      'openai provider: API call failed — 429 Too Many Requests',
    );
  });

  it('uses a custom model and size when specified', async () => {
    const provider = new OpenAIImageProvider({
      apiKey: 'sk-test',
      model: 'dall-e-3',
      size: '512x512',
    });

    await provider.generate(Buffer.from('valid-image'), 'prompt');

    const callArgs = mockEdit.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.model).toBe('dall-e-3');
    expect(callArgs.size).toBe('512x512');
  });
});
