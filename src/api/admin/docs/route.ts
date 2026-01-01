import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { specs } from "../../docs/swagger";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const baseUrl = process.env.MEDUSA_BACKEND_URL || `http://localhost:9000`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ecomcore API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
        <style>
          html { 
            box-sizing: border-box; 
          }
          *, *:before, *:after { 
            box-sizing: inherit; 
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: #fafafa;
          }
          .swagger-ui .topbar { 
            display: none !important; 
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '${baseUrl}/admin/api-spec.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "BaseLayout"
            })
            window.ui = ui
          }
        </script>
      </body>
    </html>
  `
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}
