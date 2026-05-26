export const AI_IMAGE_PROVIDER = Symbol('AI_IMAGE_PROVIDER');

export interface AiImageProvider {
  generate(sourceImage: Buffer, prompt: string): Promise<Buffer>;
}
