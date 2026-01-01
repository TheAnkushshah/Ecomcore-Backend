import { Router, Request, Response } from 'express'
import { specs } from './swagger'

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
router.get('/api-docs', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ecomcore API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css">
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; padding:0; }
          .topbar { display: none; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: '/api-spec.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            })
          }
        </script>
      </body>
    </html>
  `
  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

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
router.get('/api-spec.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(specs)
})

export default router
