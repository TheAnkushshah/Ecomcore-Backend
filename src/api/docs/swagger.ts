import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecomcore API',
      version: '1.0.0',
      description: 'Complete API documentation for Ecomcore e-commerce platform',
      contact: {
        name: 'API Support',
        email: 'support@ecomcore.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:9000',
        description: 'Development Server',
      },
      {
        url: 'https://api.ecomcore.com',
        description: 'Production Server',
      },
    ],
    paths: {
      '/store/products': {
        get: {
          tags: ['Products'],
          summary: 'List Products',
          operationId: 'listProducts',
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Product',
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/store/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get Product',
          operationId: 'getProduct',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Product',
                  },
                },
              },
            },
          },
        },
      },
      '/store/carts': {
        post: {
          tags: ['Carts'],
          summary: 'Create Cart',
          operationId: 'createCart',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    region_id: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                  },
                  required: ['region_id'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
          },
        },
      },
      '/store/carts/{id}': {
        get: {
          tags: ['Carts'],
          summary: 'Get Cart',
          operationId: 'getCart',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Cart',
                  },
                },
              },
            },
          },
        },
      },
      '/admin/health': {
        get: {
          tags: ['Health'],
          summary: 'Health Check',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'System is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'medusa_session',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: 'not_found',
            },
            message: {
              type: 'string',
              example: 'Resource not found',
            },
            type: {
              type: 'string',
              example: 'not_found_error',
            },
          },
          required: ['message'],
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'prod_01ARZ3NDEKTSV4RRFFQ69G5FAV' },
            title: { type: 'string', example: 'T-Shirt' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published'] },
            thumbnail: { type: 'string', nullable: true },
            variants: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductVariant' },
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            sku: { type: 'string' },
            prices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  currency_code: { type: 'string' },
                },
              },
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            region_id: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/LineItem' },
            },
            total: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        LineItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            product_id: { type: 'string' },
            variant_id: { type: 'string' },
            quantity: { type: 'integer' },
            unit_price: { type: 'integer' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            total: { type: 'integer' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/LineItem' },
            },
          },
        },
        Region: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            currency_code: { type: 'string' },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            handle: { type: 'string' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            handle: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [
    './src/api/store/custom/route.ts',
    './src/api/admin/custom/route.ts',
  ],
}

export const specs = swaggerJsdoc(options)
