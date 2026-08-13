import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cloud-Native Distributed Microservices System API',
      version: '1.0.0',
      description:
        'Production-grade OpenAPI documentation for the API Gateway and underlying Microservices (User Service & Notification Service).',
      contact: {
        name: 'API Support Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local API Gateway Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide a valid JWT token obtained from /api/v1/users/login or /register',
        },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'UP' },
            timestamp: { type: 'string', format: 'date-time', example: '2026-08-13T22:00:00.000Z' },
            service: { type: 'string', example: 'api-gateway' },
            uptime: { type: 'number', example: 124.5 },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'alice@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              maxLength: 100,
              description: 'Must contain uppercase, lowercase, number, and special character',
              example: 'Password123!',
            },
            name: {
              type: 'string',
              minLength: 2,
              example: 'Alice Smith',
            },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'alice@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Password123!',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'e3a89e9f-5471-460d-8df6-981f3b0c5112',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'alice@example.com',
            },
            name: {
              type: 'string',
              example: 'Alice Smith',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-08-13T18:00:00.000Z',
            },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User registered successfully' },
            data: { $ref: '#/components/schemas/User' },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        UserProfileResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/User' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Invalid request payload or resource not found' },
            errors: {
              type: 'array',
              items: { type: 'object' },
              example: [{ field: 'email', message: 'Invalid email address format' }],
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'API Gateway Health Check',
          description: 'Returns operational status, uptime, and system timestamp of the API Gateway.',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Gateway is healthy and operational',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/register': {
        post: {
          summary: 'Register a new user account',
          description:
            'Creates a user record in PostgreSQL via User Service and publishes a user.created event to NATS JetStream.',
          tags: ['Authentication & Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User successfully created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RegisterResponse' },
                },
              },
            },
            '400': {
              description: 'Validation failure or user already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded on authentication endpoints',
            },
          },
        },
      },
      '/api/v1/users/login': {
        post: {
          summary: 'Authenticate user credentials',
          description: 'Validates user credentials against User Service and returns a signed JWT Token.',
          tags: ['Authentication & Users'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded on authentication endpoints',
            },
          },
        },
      },
      '/api/v1/users/profile': {
        get: {
          summary: 'Get current user profile',
          description: 'Fetches the authenticated user profile. Requires valid JWT Bearer header.',
          tags: ['Authentication & Users'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserProfileResponse' },
                },
              },
            },
            '401': {
              description: 'Missing or invalid JWT token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/{id}': {
        get: {
          summary: 'Get user by ID',
          description: 'Retrieves public user profile by UUID. Requires valid JWT Bearer header.',
          tags: ['Authentication & Users'],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User UUID',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserProfileResponse' },
                },
              },
            },
            '404': {
              description: 'User not found',
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
