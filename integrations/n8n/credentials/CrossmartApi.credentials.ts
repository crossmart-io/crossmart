import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import {
	API_KEY_DOCUMENTATION_URL,
	API_KEY_HEADER,
	API_VERSION_PREFIX,
	CREDENTIAL_TYPE,
	DEFAULT_BASE_URL,
} from '../nodes/shared/crossmart.constants';

export class CrossmartApi implements ICredentialType {
	name = CREDENTIAL_TYPE;

	displayName = 'Crossmart API';

	icon: Icon = { light: 'file:../icons/crossmart.svg', dark: 'file:../icons/crossmart.dark.svg' };

	documentationUrl = API_KEY_DOCUMENTATION_URL;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'A workspace API key, from Settings → API keys in the Crossmart dashboard. Give n8n its own key with the smallest role that works.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: DEFAULT_BASE_URL,
			description: 'Change it only for a self-hosted Crossmart, such as http://localhost:3000',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				[API_KEY_HEADER]: '={{$credentials.apiKey}}',
			},
		},
	};

	/** `GET /api/v1/api-key` answers any valid key with its workspace and role. */
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "").replace(/\\/api\\/v1$/, "")}}',
			url: `${API_VERSION_PREFIX}/api-key`,
			method: 'GET',
		},
	};
}
