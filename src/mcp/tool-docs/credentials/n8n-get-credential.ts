import { ToolDocumentation } from '../types';

export const n8nGetCredentialDoc: ToolDocumentation = {
  name: 'n8n_get_credential',
  category: 'credentials',
  essentials: {
    description: 'Get credential metadata by ID (no sensitive data returned)',
    keyParameters: ['id'],
    example: 'n8n_get_credential({id: "123"})',
    performance: 'Fast - single API call',
    tips: [
      'Returns metadata and node access info only',
      'Use to verify which nodes can use a credential',
      'Sensitive data (keys, passwords) is never returned'
    ]
  },
  full: {
    description: `Retrieves metadata for a specific credential by ID.

Returns credential metadata including which node types have access to use it. Does NOT return sensitive credential data (API keys, passwords, tokens) for security.

Use this tool to:
- Verify credential exists before workflow operations
- Check which node types can use a credential
- Get credential details for documentation`,
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'Credential ID'
      }
    },
    returns: `Object containing:
- id: Credential ID
- name: Display name
- type: Credential type (e.g., "slackApi")
- nodesAccess: Array of node types that can use this credential
  - nodeType: Node type string
  - date: When access was granted
- createdAt: Creation timestamp
- updatedAt: Last update timestamp`,
    examples: [
      'n8n_get_credential({id: "123"}) - Get credential details',
      '// Verify credential before workflow deployment\nconst cred = await n8n_get_credential({id: credId});\nif (!cred.success) console.error("Credential not found");'
    ],
    useCases: [
      'Verify credential exists before deployment',
      'Check node access permissions',
      'Document credential configuration',
      'Troubleshoot credential issues'
    ],
    performance: `Fast response:
- Single API call to n8n
- Minimal response size`,
    bestPractices: [
      'Verify credentials exist before referencing in workflows',
      'Check nodesAccess to ensure nodes can use the credential'
    ],
    pitfalls: [
      'Does not return actual credential data (API keys, passwords)',
      'Returns 404 if credential does not exist',
      'Requires N8N_API_URL and N8N_API_KEY configuration'
    ],
    relatedTools: ['n8n_list_credentials', 'n8n_update_credential', 'n8n_delete_credential']
  }
};
