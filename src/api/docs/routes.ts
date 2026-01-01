import swaggerUi from 'swagger-ui-express'
import { Router } from 'express'
import { specs } from '../../docs/swagger'

const router = Router()

/**
 * @swagger
 * /api-docs:
 *   get:
 *     tags:
 *       - API Documentation
 *     summary: Swagger API Documentation UI
 *     description: Interactive API documentation interface
 *     responses:
 *       200:
 *         description: Swagger UI page
 */
router.use('/api-docs', swaggerUi.serve)
router.get('/api-docs', swaggerUi.setup(specs, {
  swaggerOptions: {
    urls: [
      {
        url: '/api-spec.json',
        name: 'Ecomcore API v1.0.0',
      },
    ],
  },
  customCss: '.swagger-ui .topbar { display: none }',
}))

/**
 * @swagger
 * /api-spec.json:
 *   get:
 *     tags:
 *       - API Documentation
 *     summary: OpenAPI 3.0 Specification JSON
 *     description: Raw OpenAPI specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/api-spec.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(specs)
})

export default router
