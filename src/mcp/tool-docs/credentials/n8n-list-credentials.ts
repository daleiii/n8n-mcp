import { ToolDocumentation } from '../types';

export const n8nListCredentialsDoc: ToolDocumentation = {
  name: 'n8n_list_credentials',
  category: 'credentials',
  essentials: {
    description: 'List credentials configured in n8n instance (metadata only, no sensitive data)',
    keyParameters: ['limit', 'cursor', 'type'],
    example: 'n8n_list_credentials({type: "slackApi"})',
    performance: 'Fast - single API call',
    tips: [
      'Returns metadata only - never returns API keys or passwords',
      'Use type filter to find credentials for specific integrations',
      'Check available credentials before deploying workflows',
      'Pagination via cursor for large credential lists'
    ]
  },
  full: {
    description: `Lists all credentials configured in the n8n instance.

Returns metadata only for security - the actual credential data (API keys, passwords, tokens) is never returned through this API.

Use this tool to:
- Check if required credentials exist before deploying a workflow
- Audit configured credentials
- Get credential IDs for workflow configuration
- Find credentials by type for specific integrations`,
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Number of credentials to return (1-100)',
        default: 100
      },
      cursor: {
        type: 'string',
        required: false,
        description: 'Pagination cursor from previous response'
      },
      type: {
        type: 'string',
        required: false,
        description: 'Filter by credential type (e.g., "slackApi", "httpBasicAuth", "gmailOAuth2Api")'
      }
    },
    returns: `Object containing:
- credentials: Array of credential metadata
  - id: Credential ID
  - name: Display name
  - type: Credential type
  - createdAt: Creation timestamp
  - updatedAt: Last update timestamp
- returned: Number of credentials returned
- nextCursor: Pagination cursor (if more available)
- hasMore: Boolean indicating more credentials exist`,
    examples: [
      'n8n_list_credentials({}) - List all credentials',
      'n8n_list_credentials({type: "slackApi"}) - Find Slack credentials',
      'n8n_list_credentials({limit: 10}) - Get first 10 credentials',
      'n8n_list_credentials({cursor: "abc123"}) - Get next page'
    ],
    useCases: [
      'Pre-deployment checks - verify required credentials exist',
      'Credential audit - list all configured integrations',
      'Workflow planning - check available credentials',
      'Troubleshooting - verify credential configuration'
    ],
    performance: `Fast response:
- Single API call to n8n
- Response size depends on credential count
- Use pagination for instances with many credentials`,
    bestPractices: [
      'Check credentials before deploying workflows that require them',
      'Use type filter when looking for specific integrations',
      'Store credential IDs for workflow configuration',
      'Regularly audit credentials for security'
    ],
    pitfalls: [
      'Does not return sensitive credential data (by design)',
      'Requires N8N_API_URL and N8N_API_KEY configuration',
      'Cannot verify if credentials are valid or expired'
    ],
    relatedTools: ['n8n_get_credential', 'n8n_create_credential', 'n8n_deploy_template']
  }
};
