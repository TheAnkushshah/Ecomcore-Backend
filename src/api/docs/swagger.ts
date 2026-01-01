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
            id: {
              type: 'string',
              example: 'prod_01ARZ3NDEKTSV4RRFFQ69G5FAV',
            },
            title: {
              type: 'string',
              example: 'T-Shirt',
            },
            description: {
              type: 'string',
              example: 'A comfortable cotton t-shirt',
            },
            subtitle: {
              type: 'string',
              example: 'Premium Quality',
            },
            status: {
              type: 'string',
              enum: ['draft', 'proposed', 'published', 'rejected'],
              example: 'published',
            },
            thumbnail: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/image.jpg',
            },
            weight: {
              type: 'number',
              nullable: true,
              example: 0.5,
            },
            length: {
              type: 'number',
              nullable: true,
              example: 10,
            },
            width: {
              type: 'number',
              nullable: true,
            },
            height: {
              type: 'number',
              nullable: true,
            },
            hs_code: {
              type: 'string',
              nullable: true,
            },
            origin_country: {
              type: 'string',
              nullable: true,
              example: 'US',
            },
            mid_code: {
              type: 'string',
              nullable: true,
            },
            material: {
              type: 'string',
              nullable: true,
              example: 'Cotton',
            },
            collection_id: {
              type: 'string',
              nullable: true,
            },
            type_id: {
              type: 'string',
              nullable: true,
            },
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  value: {
                    type: 'string',
                  },
                },
              },
            },
            variants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductVariant',
              },
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  url: {
                    type: 'string',
                  },
                  alt_text: {
                    type: 'string',
                    nullable: true,
                  },
                },
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
              example: 'Red / Small',
            },
            sku: {
              type: 'string',
              example: 'SKU-001',
            },
            barcode: {
              type: 'string',
              nullable: true,
            },
            ean: {
              type: 'string',
              nullable: true,
            },
            upc: {
              type: 'string',
              nullable: true,
            },
            weight: {
              type: 'number',
              nullable: true,
            },
            length: {
              type: 'number',
              nullable: true,
            },
            width: {
              type: 'number',
              nullable: true,
            },
            height: {
              type: 'number',
              nullable: true,
            },
            hs_code: {
              type: 'string',
              nullable: true,
            },
            origin_country: {
              type: 'string',
              nullable: true,
            },
            mid_code: {
              type: 'string',
              nullable: true,
            },
            material: {
              type: 'string',
              nullable: true,
            },
            prices: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'number',
                    example: 2999,
                  },
                  currency_code: {
                    type: 'string',
                    example: 'usd',
                  },
                },
              },
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
            },
            region_id: {
              type: 'string',
            },
            customer_id: {
              type: 'string',
              nullable: true,
            },
            billing_address_id: {
              type: 'string',
              nullable: true,
            },
            shipping_address_id: {
              type: 'string',
              nullable: true,
            },
            payment_session: {
              type: 'object',
              nullable: true,
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LineItem',
              },
            },
            subtotal: {
              type: 'integer',
              example: 5998,
            },
            discount_total: {
              type: 'integer',
              example: 0,
            },
            tax_total: {
              type: 'integer',
              example: 600,
            },
            total: {
              type: 'integer',
              example: 6598,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LineItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            cart_id: {
              type: 'string',
            },
            product_id: {
              type: 'string',
            },
            variant_id: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
              example: 2,
            },
            unit_price: {
              type: 'integer',
              example: 2999,
            },
            total: {
              type: 'integer',
              example: 5998,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            customer_id: {
              type: 'string',
              nullable: true,
            },
            region_id: {
              type: 'string',
            },
            currency_code: {
              type: 'string',
              example: 'usd',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'archived', 'canceled'],
              example: 'pending',
            },
            payment_status: {
              type: 'string',
              enum: ['not_paid', 'awaiting', 'captured', 'partially_refunded', 'refunded', 'canceled'],
              example: 'not_paid',
            },
            fulfillment_status: {
              type: 'string',
              enum: ['not_fulfilled', 'partially_fulfilled', 'fulfilled', 'partially_returned', 'returned', 'canceled'],
              example: 'not_fulfilled',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LineItem',
              },
            },
            subtotal: {
              type: 'integer',
              example: 5998,
            },
            tax_total: {
              type: 'integer',
              example: 600,
            },
            discount_total: {
              type: 'integer',
              example: 0,
            },
            shipping_total: {
              type: 'integer',
              example: 0,
            },
            total: {
              type: 'integer',
              example: 6598,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Region: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
              example: 'United States',
            },
            currency_code: {
              type: 'string',
              example: 'usd',
            },
            countries: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['US', 'CA'],
            },
            tax_code: {
              type: 'string',
              nullable: true,
            },
            automatic_taxes: {
              type: 'boolean',
              example: true,
            },
            payment_providers: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            fulfillment_providers: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            includes_tax: {
              type: 'boolean',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
              example: 'Summer Collection',
            },
            description: {
              type: 'string',
              example: 'Our best summer picks',
            },
            handle: {
              type: 'string',
              example: 'summer-collection',
            },
            products: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product',
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
              example: 'Clothing',
            },
            description: {
              type: 'string',
              example: 'Apparel and clothing items',
            },
            handle: {
              type: 'string',
              example: 'clothing',
            },
            mpath: {
              type: 'string',
              nullable: true,
              example: 'clothing/mens/shirts',
            },
            is_active: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
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
