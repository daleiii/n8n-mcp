import { ToolDocumentation } from '../types';

export const n8nCreateCredentialDoc: ToolDocumentation = {
  name: 'n8n_create_credential',
  category: 'credentials',
  essentials: {
    description: 'Create a new credential with name, type, and data',
    keyParameters: ['name', 'type', 'data'],
    example: 'n8n_create_credential({name: "My Slack", type: "slackApi", data: {accessToken: "xoxb-..."}})',
    performance: 'Fast - single API call',
    tips: [
      'Data fields depend on credential type',
      'Check n8n docs for required fields per type',
      'Credentials are encrypted at rest in n8n',
      'Use nodesAccess to restrict which nodes can use it'
    ]
  },
  full: {
    description: `Creates a new credential in the n8n instance.

SECURITY WARNING: This tool transmits sensitive credential data. Only use with trusted n8n instances over secure connections.

The data object structure depends on the credential type:
- API Key types: {apiKey: "..."}
- Basic Auth: {user: "...", password: "..."}
- OAuth2: Typically requires browser-based flow (not supported via API)
- Custom: Check n8n documentation for required fields`,
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'Display name for the credential'
      },
      type: {
        type: 'string',
        required: true,
        description: 'Credential type (e.g., "slackApi", "httpBasicAuth", "notionApi")'
      },
      data: {
        type: 'object',
        required: true,
        description: 'Credential data - fields depend on type'
      },
      nodesAccess: {
        type: 'array',
        required: false,
        description: 'Node types that can use this credential'
      }
    },
    returns: `Object containing created credential metadata:
- id: New credential ID
- name: Display name
- type: Credential type
- createdAt: Creation timestamp
- message: Success confirmation`,
    examples: [
      '// Create Slack credential\nn8n_create_credential({\n  name: "Slack Bot",\n  type: "slackApi",\n  data: { accessToken: "xoxb-your-token" }\n})',
      '// Create HTTP Basic Auth\nn8n_create_credential({\n  name: "API Auth",\n  type: "httpBasicAuth",\n  data: { user: "admin", password: "secret" }\n})',
      '// Create with node access restriction\nn8n_create_credential({\n  name: "Notion",\n  type: "notionApi",\n  data: { apiKey: "secret_..." },\n  nodesAccess: [{ nodeType: "n8n-nodes-base.notion" }]\n})'
    ],
    useCases: [
      'Automated credential provisioning',
      'Setting up integrations programmatically',
      'Migrating credentials between instances',
      'CI/CD credential configuration'
    ],
    performance: `Fast response:
- Single API call to n8n
- Credentials encrypted before storage`,
    bestPractices: [
      'Use descriptive names for easy identification',
      'Store credentials from secure sources (env vars, secrets manager)',
      'Restrict nodesAccess when possible for security',
      'Verify creation succeeded before using in workflows'
    ],
    pitfalls: [
      'OAuth2 credentials typically require browser-based flow',
      'Sensitive data transmitted - ensure secure connection',
      'Invalid credential type will fail',
      'Missing required data fields will fail',
      'Some credential types have specific validation rules'
    ],
    relatedTools: ['n8n_list_credentials', 'n8n_update_credential', 'n8n_delete_credential']
  }
};
