import { ChannelType } from '@crossmart/connectors';
import { AiFeature } from '../../ai/enums/ai-feature.enum.js';
import { AiOutputRejectedError } from '../../ai/errors/ai.errors.js';
import { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AiUsageService } from '../../ai/services/ai-usage.service.js';
import { FakeAiProvider } from '../../ai/testing/fake-ai.provider.js';
import { contentTarget, GENERATED } from '../testing/content-target.fixtures.js';
import { ContentGenerator } from './content.generator.js';

function setup() {
  const provider = new FakeAiProvider();
  const usage = { record: vi.fn<AiUsageService['record']>().mockResolvedValue() };
  const generator = new ContentGenerator(
    new AiGateway(provider, usage as unknown as AiUsageService),
  );
  return { generator, provider, usage };
}

describe('ContentGenerator', () => {
  it('asks for content within the channel’s rules and meters the call', async () => {
    const { generator, provider, usage } = setup();
    provider.answerWith(GENERATED);

    const content = await generator.generate(contentTarget());

    expect(content).toEqual(GENERATED);
    const [request] = provider.requests;
    expect(request.system).toContain('eBay');
    expect(request.system).toContain('at most 80 characters');
    expect(request.prompt).toContain('"vendor":"Acme"');
    expect(request.prompt).toContain('"optionValues":["Blue"]');
    expect(usage.record).toHaveBeenCalledWith(
      expect.objectContaining({ feature: AiFeature.ContentGeneration }),
    );
  });

  it('rejects a title longer than the channel allows', async () => {
    const { generator, provider } = setup();
    provider.answerWith({ ...GENERATED, title: 'x'.repeat(81) });

    await expect(generator.generate(contentTarget())).rejects.toThrow(AiOutputRejectedError);
  });

  it('strips markup from titles, and links and scripts from eBay descriptions', async () => {
    const { generator, provider } = setup();
    provider.answerWith({
      ...GENERATED,
      title: '<b>Acme</b>  Mug',
      descriptionHtml: '<p>See <a href="https://x.example">site</a></p><script>x()</script>',
    });

    const content = await generator.generate(contentTarget());

    expect(content.title).toBe('Acme Mug');
    expect(content.descriptionHtml).toBe('<p>See site</p>');
  });

  it('keeps links on Shopify, which allows them', async () => {
    const { generator, provider } = setup();
    provider.answerWith({
      ...GENERATED,
      descriptionHtml: '<p><a href="https://x.example">a</a></p>',
    });

    const content = await generator.generate(contentTarget(ChannelType.Shopify));

    expect(content.descriptionHtml).toContain('href="https://x.example"');
  });

  it('rejects an answer left empty once cleaned', async () => {
    const { generator, provider } = setup();
    provider.answerWith({ ...GENERATED, descriptionHtml: '<script>only()</script>' });

    await expect(generator.generate(contentTarget())).rejects.toThrow(AiOutputRejectedError);
  });
});
