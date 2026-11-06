import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		// Crossmart is AGPL-3.0, and n8n's verified community nodes must be MIT. Until the license is
		// decided (see docs/developers/n8n.md), this one rule is off and `n8n.strict` is false in
		// package.json. Once the package is MIT, delete this block and set `strict` back to true.
		files: ['package.json'],
		rules: { 'n8n-nodes-base/community-package-json-license-not-default': 'off' },
	},
];
