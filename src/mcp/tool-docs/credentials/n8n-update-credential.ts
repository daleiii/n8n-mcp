import { ToolDocumentation } from '../types';

export const n8nUpdateCredentialDoc: ToolDocumentation = {
  name: 'n8n_update_credential',
  category: 'credentials',
  essentials: {
    description: 'Update an existing credential (name, type, or data)',
    keyParameters: ['id', 'name', 'data'],
    example: 'n8n_update_credential({id: "123", data: {apiKey: "new-key"}})',
    performance: 'Fast - single API call',
    tips: [
      'Use for rotating API keys or tokens',
      'Data field replaces existing data entirely',
      'Only include fields you want to change'
    ]
  },
  full: {
    description: `Updates an existing credential in the n8n instance.

SECURITY WARNING: This tool transmits sensitive credential data when updating the data field. Only use with trusted n8n instances over secure connections.

Common use cases:
- Rotating API keys
- Updating expired tokens
- Renaming credentials
- Changing node access permissions

IMPORTANT: The data field replaces existing data entirely - you cannot partially update data fields.`,
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'Credential ID to update'
      },
      name: {
        type: 'string',
        required: false,
        description: 'New display name'
      },
      type: {
        type: 'string',
        required: false,
        description: 'New credential type (rarely changed)'
      },
      data: {
        type: 'object',
        required: false,
        description: 'New credential data - replaces existing data entirely'
      },
      nodesAccess: {
        type: 'array',
        required: false,
        description: 'Update node types that can use this credential'
      }
    },
    returns: `Object containing updated credential metadata:
- id: Credential ID
- name: Display name
- type: Credential type
- updatedAt: Update timestamp
- message: Success confirmation`,
    examples: [
      '// Rotate API key\nn8n_update_credential({\n  id: "123",\n  data: { apiKey: "new-api-key" }\n})',
      '// Rename credential\nn8n_update_credential({\n  id: "123",\n  name: "Production Slack"\n})',
      '// Update with new token and name\nn8n_update_credential({\n  id: "123",\n  name: "Refreshed Token",\n  data: { accessToken: "new-token" }\n})'
    ],
    useCases: [
      'API key rotation',
      'Token refresh after expiration',
      'Credential renaming for clarity',
      'Updating node access permissions'
    ],
    performance: `Fast response:
- Single API call to n8n
- Credentials re-encrypted after update`,
    bestPractices: [
      'Rotate credentials regularly for security',
      'Update credentials before they expire',
      'Use descriptive names when renaming',
      'Verify update succeeded before relying on new credentials'
    ],
    pitfalls: [
      'Data field replaces entirely - cannot partially update',
      'Updating type may break workflows using the credential',
      'Sensitive data transmitted - ensure secure connection',
      'Returns 404 if credential does not exist'
    ],
    relatedTools: ['n8n_get_credential', 'n8n_create_credential', 'n8n_delete_credential']
  }
};
