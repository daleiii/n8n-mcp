/**
 * Unit tests for credential management handlers
 * Tests the credential tools available in the n8n public API:
 * - n8n_get_credential_schema (GET schema for a credential type)
 * - n8n_create_credential (POST to create)
 * - n8n_update_credential (PATCH to update)
 * - n8n_delete_credential (DELETE to remove)
 *
 * NOTE: n8n public API does NOT support listing or getting credentials by ID
 * for security reasons. See: https://docs.n8n.io/api/api-reference/#tag/credential
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { N8nApiClient } from '@/services/n8n-api-client';
import {
  N8nApiError,
  N8nAuthenticationError,
  N8nNotFoundError,
  N8nValidationError,
} from '@/utils/n8n-errors';

// Mock dependencies
vi.mock('@/services/n8n-api-client');
vi.mock('@/config/n8n-api', () => ({
  getN8nApiConfig: vi.fn()
}));
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  })),
  LogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  }
}));

describe('Credential Management Handlers', () => {
  let mockApiClient: any;
  let handlers: any;
  let getN8nApiConfig: any;

  // Helper function to create test credential data
  const createTestCredential = (overrides = {}) => ({
    id: 'cred-123',
    name: 'Test Credential',
    type: 'httpBasicAuth',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Setup mock API client with credential methods
    mockApiClient = {
      getCredentialSchema: vi.fn(),
      createCredential: vi.fn(),
      updateCredential: vi.fn(),
      deleteCredential: vi.fn(),
    };

    // Import mocked modules
    getN8nApiConfig = (await import('@/config/n8n-api')).getN8nApiConfig;

    // Mock the API config
    vi.mocked(getN8nApiConfig).mockReturnValue({
      baseUrl: 'https://n8n.test.com',
      apiKey: 'test-key',
      timeout: 30000,
      maxRetries: 3,
    });

    // Mock the N8nApiClient constructor
    vi.mocked(N8nApiClient).mockImplementation(() => mockApiClient);

    // Import handlers module after setting up mocks
    handlers = await import('@/mcp/handlers-n8n-manager');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleGetCredentialSchema', () => {
    it('should get credential schema successfully', async () => {
      const mockSchema = {
        additionalProperties: false,
        type: 'object',
        properties: {
          user: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['user', 'password']
      };

      mockApiClient.getCredentialSchema.mockResolvedValue(mockSchema);

      const result = await handlers.handleGetCredentialSchema({
        credentialTypeName: 'httpBasicAuth'
      });

      expect(result.success).toBe(true);
      expect(result.data.credentialTypeName).toBe('httpBasicAuth');
      expect(result.data.schema).toEqual(mockSchema);
      expect(mockApiClient.getCredentialSchema).toHaveBeenCalledWith('httpBasicAuth');
    });

    it('should handle missing credential type parameter', async () => {
      const result = await handlers.handleGetCredentialSchema({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unknown credential type', async () => {
      mockApiClient.getCredentialSchema.mockRejectedValue(
        new N8nNotFoundError('Credential type not found')
      );

      const result = await handlers.handleGetCredentialSchema({
        credentialTypeName: 'unknownType'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle API errors', async () => {
      mockApiClient.getCredentialSchema.mockRejectedValue(
        new N8nApiError('API error', 500)
      );

      const result = await handlers.handleGetCredentialSchema({
        credentialTypeName: 'slackApi'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleCreateCredential', () => {
    it('should create a credential successfully', async () => {
      const newCredential = createTestCredential({ id: 'new-cred-123' });

      mockApiClient.createCredential.mockResolvedValue(newCredential);

      const result = await handlers.handleCreateCredential({
        name: 'New Credential',
        type: 'httpBasicAuth',
        data: { username: 'user', password: 'pass' },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('created');
      expect(mockApiClient.createCredential).toHaveBeenCalledWith({
        name: 'New Credential',
        type: 'httpBasicAuth',
        data: { username: 'user', password: 'pass' },
      });
    });

    it('should handle missing required parameters', async () => {
      const result = await handlers.handleCreateCredential({
        name: 'Test',
        // missing type and data
      });

      expect(result.success).toBe(false);
    });

    it('should handle validation errors', async () => {
      mockApiClient.createCredential.mockRejectedValue(
        new N8nValidationError('Invalid credential data')
      );

      const result = await handlers.handleCreateCredential({
        name: 'Test',
        type: 'invalidType',
        data: {},
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleUpdateCredential', () => {
    it('should update a credential successfully', async () => {
      const updatedCredential = createTestCredential({
        name: 'Updated Credential',
      });

      mockApiClient.updateCredential.mockResolvedValue(updatedCredential);

      const result = await handlers.handleUpdateCredential({
        id: 'cred-123',
        name: 'Updated Credential',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('updated');
    });

    it('should allow updating only the name', async () => {
      const updatedCredential = createTestCredential({
        name: 'New Name',
      });

      mockApiClient.updateCredential.mockResolvedValue(updatedCredential);

      const result = await handlers.handleUpdateCredential({
        id: 'cred-123',
        name: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(mockApiClient.updateCredential).toHaveBeenCalledWith(
        'cred-123',
        expect.objectContaining({ name: 'New Name' })
      );
    });

    it('should allow updating the data', async () => {
      const updatedCredential = createTestCredential();

      mockApiClient.updateCredential.mockResolvedValue(updatedCredential);

      const result = await handlers.handleUpdateCredential({
        id: 'cred-123',
        data: { newKey: 'newValue' },
      });

      expect(result.success).toBe(true);
    });

    it('should handle missing ID parameter', async () => {
      const result = await handlers.handleUpdateCredential({
        name: 'New Name',
      });

      expect(result.success).toBe(false);
    });

    it('should handle not found errors', async () => {
      mockApiClient.updateCredential.mockRejectedValue(
        new N8nNotFoundError('Credential not found')
      );

      const result = await handlers.handleUpdateCredential({
        id: 'non-existent',
        name: 'New Name',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleDeleteCredential', () => {
    it('should delete a credential successfully', async () => {
      mockApiClient.deleteCredential.mockResolvedValue(undefined);

      const result = await handlers.handleDeleteCredential({ id: 'cred-123' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
      expect(mockApiClient.deleteCredential).toHaveBeenCalledWith('cred-123');
    });

    it('should handle missing ID parameter', async () => {
      const result = await handlers.handleDeleteCredential({});

      expect(result.success).toBe(false);
    });

    it('should handle not found errors', async () => {
      mockApiClient.deleteCredential.mockRejectedValue(
        new N8nNotFoundError('Credential not found')
      );

      const result = await handlers.handleDeleteCredential({ id: 'non-existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle credentials in use errors', async () => {
      mockApiClient.deleteCredential.mockRejectedValue(
        new N8nApiError('Credential is in use by workflows', 409)
      );

      const result = await handlers.handleDeleteCredential({ id: 'cred-in-use' });

      expect(result.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle missing API configuration', async () => {
      vi.mocked(getN8nApiConfig).mockReturnValue(null as any);

      // Re-import to get fresh module with null config
      vi.resetModules();
      const freshHandlers = await import('@/mcp/handlers-n8n-manager');

      const result = await freshHandlers.handleGetCredentialSchema({
        credentialTypeName: 'httpBasicAuth'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should handle network errors gracefully', async () => {
      mockApiClient.getCredentialSchema.mockRejectedValue(new Error('Network error'));

      const result = await handlers.handleGetCredentialSchema({
        credentialTypeName: 'slackApi'
      });

      expect(result.success).toBe(false);
    });
  });
});
