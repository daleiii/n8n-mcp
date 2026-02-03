import { ToolDocumentation } from '../types';

export const n8nDeleteCredentialDoc: ToolDocumentation = {
  name: 'n8n_delete_credential',
  category: 'credentials',
  essentials: {
    description: 'Permanently delete a credential (cannot be undone)',
    keyParameters: ['id'],
    example: 'n8n_delete_credential({id: "123"})',
    performance: 'Fast - single API call',
    tips: [
      'This action cannot be undone',
      'Workflows using this credential will fail',
      'Check for dependent workflows before deleting'
    ]
  },
  full: {
    description: `Permanently deletes a credential from the n8n instance.

WARNING: This action cannot be undone. Any workflows configured to use this credential will fail until reconfigured with a different credential.

Before deleting:
1. Check if any workflows depend on this credential
2. Update or deactivate dependent workflows
3. Consider renaming instead of deleting if unsure`,
    parameters: {
      id: {
        type: 'string',
        required: true,
        description: 'Credential ID to delete'
      }
    },
    returns: `Object containing:
- id: Deleted credential ID
- deleted: Boolean (true)
- message: Success confirmation`,
    examples: [
      'n8n_delete_credential({id: "123"}) - Delete credential',
      '// Safe deletion workflow\nconst workflows = await n8n_list_workflows({});\n// Check for credential usage first\nawait n8n_delete_credential({id: credentialId});'
    ],
    useCases: [
      'Remove compromised credentials',
      'Clean up unused integrations',
      'Security response to credential leak',
      'Decommissioning integrations'
    ],
    performance: `Fast response:
- Single API call to n8n`,
    bestPractices: [
      'Verify no workflows depend on the credential',
      'Deactivate dependent workflows first',
      'Keep audit trail of deleted credentials',
      'Consider disabling instead of deleting if unsure'
    ],
    pitfalls: [
      'Cannot be undone',
      'Dependent workflows will fail immediately',
      'No built-in check for dependent workflows',
      'Returns 404 if credential does not exist'
    ],
    relatedTools: ['n8n_list_credentials', 'n8n_get_credential', 'n8n_list_workflows']
  }
};
