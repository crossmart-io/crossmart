# llms.txt for Crossmart's sites

[llms.txt](https://llmstxt.org) tells AI agents what a site is and where to read more. These files
are the source for both public sites. They live here so they change together with the API and
Ask Crossmart (ADR 0022). Copy them into the site repositories by hand. Nothing deploys them from here.

| File                                                       | Served at                            | Where it goes                     |
| ---------------------------------------------------------- | ------------------------------------ | --------------------------------- |
| [`crossmart.io.llms.txt`](crossmart.io.llms.txt)           | `https://crossmart.io/llms.txt`      | crossmart-site: `public/llms.txt` |
| [`docs.crossmart.io.llms.txt`](docs.crossmart.io.llms.txt) | `https://docs.crossmart.io/llms.txt` | crossmart-docs: see below         |

## crossmart.io

Copy `crossmart.io.llms.txt` to `public/llms.txt` in crossmart-site. Astro serves `public/` as is.
Check `https://crossmart.io/llms.txt` after the deploy. Update the plan list on the pricing page
and this file together.

## docs.crossmart.io

The docs site already generates `llms.txt`, `llms-full.txt` and `llms-small.txt` with the
`starlight-llms-txt` plugin, which lists every page. Do not add a `public/llms.txt` there: it would
clash with the generated file. Instead, put this file's summary and "Ask Crossmart" section into
the plugin's options in `astro.config.mjs`:

```js
starlightLlmsTxt({
  projectName: 'Crossmart',
  description: '…the blockquote line of docs.crossmart.io.llms.txt…',
  details: '…the paragraphs and the "Ask Crossmart" section of docs.crossmart.io.llms.txt…',
  optionalLinks: [
    { label: 'OpenAPI spec', url: 'https://api.crossmart.io/api/docs-json' },
    { label: 'crossmart.io', url: 'https://crossmart.io' },
  ],
}),
```

`docs.crossmart.io.llms.txt` shows the whole intended result, including the page list the plugin
generates, so the two can be compared after a build (`pnpm build`, then `dist/llms.txt`).
