import { RepoScrapingService } from './repo-scraping.service';

const repoHtml =
  '<article class="Box-row"><h2><a href="/owner/repo"> owner / repo </a></h2></article>';
const developerHtml =
  '<article class="Box-row d-flex"><p class="f4"><a class="Link--secondary">owner</a></p><h1 class="h4"><a href="/owner/repo">repo</a></h1></article>';

function page(html: string) {
  return { ok: true, text: async () => html } as Response;
}

describe('trending page collection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('extracts repository identities from links and deduplicates across language pages', async () => {
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(page(repoHtml));
    const result = await new RepoScrapingService().scrapeTrending();
    expect(result).toEqual({ items: ['owner/repo'], failedPages: [] });
    expect(fetch).toHaveBeenCalledWith(
      'https://github.com/trending/c%2B%2B?since=daily',
      expect.any(Object),
    );
  });

  it('retains successful pages and reports exhausted retries as failures', async () => {
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (url) =>
        String(url).includes('/python?')
          ? ({ ok: false, status: 403 } as Response)
          : page(repoHtml),
      );
    const pending = new RepoScrapingService().scrapeTrending();
    await jest.runAllTimersAsync();
    expect(await pending).toEqual({
      items: ['owner/repo'],
      failedPages: ['python'],
    });
    expect(
      fetch.mock.calls.filter(([url]) => String(url).includes('/python?')),
    ).toHaveLength(3);
  });

  it('does not turn total request failure into successful empty collection', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('unreachable'));
    const pending = new RepoScrapingService().scrapeTrending();
    await jest.runAllTimersAsync();
    const result = await pending;
    expect(result.items).toEqual([]);
    expect(result.failedPages).toHaveLength(9);
  });

  it('extracts developers and deduplicates them across pages', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(page(developerHtml));
    expect(await new RepoScrapingService().scrapeTrendingDevelopers()).toEqual({
      items: [{ username: 'owner', repositoryPath: 'owner/repo' }],
      failedPages: [],
    });
  });
});
