/**
 * @swagger
 * /store/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: List all products
 *     description: Retrieves a paginated list of products available in the store
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of products to return (default 20, max 100)
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - name: offset
 *         in: query
 *         description: Number of products to skip
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *       - name: collection_id
 *         in: query
 *         description: Filter by collection ID
 *         schema:
 *           type: string
 *       - name: category_id
 *         in: query
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *       - name: q
 *         in: query
 *         description: Search query (searches title and description)
 *         schema:
 *           type: string
 *       - name: order_by
 *         in: query
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, title, price]
 *           default: created_at
 *       - name: is_giftcard
 *         in: query
 *         description: Filter gift cards
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 count:
 *                   type: integer
 *                   example: 50
 *                 offset:
 *                   type: integer
 *                   example: 0
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/products/{product_id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product details
 *     description: Retrieves detailed information for a specific product including variants, images, and pricing
 *     parameters:
 *       - name: product_id
 *         in: path
 *         required: true
 *         description: Product ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/product-categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List product categories
 *     description: Retrieves all active product categories
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of categories to return
 *         schema:
 *           type: integer
 *           default: 100
 *       - name: offset
 *         in: query
 *         description: Number of categories to skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product_categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/collections:
 *   get:
 *     tags:
 *       - Collections
 *     summary: List product collections
 *     description: Retrieves all available product collections
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 100
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collections:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/regions:
 *   get:
 *     tags:
 *       - Regions
 *     summary: List available regions
 *     description: Retrieves all available regions for shopping
 *     responses:
 *       200:
 *         description: List of regions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 regions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Region'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/carts:
 *   post:
 *     tags:
 *       - Carts
 *     summary: Create a new cart
 *     description: Creates a new shopping cart for an anonymous or authenticated user
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               region_id:
 *                 type: string
 *                 description: Region ID for the cart
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer email (optional)
 *               currency_code:
 *                 type: string
 *                 description: Currency code (e.g., USD)
 *     responses:
 *       201:
 *         description: Cart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/carts/{cart_id}:
 *   get:
 *     tags:
 *       - Carts
 *     summary: Get cart details
 *     description: Retrieves the current state of a shopping cart
 *     parameters:
 *       - name: cart_id
 *         in: path
 *         required: true
 *         description: Cart ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/carts/{cart_id}/line-items:
 *   post:
 *     tags:
 *       - Carts
 *     summary: Add item to cart
 *     description: Adds a product variant to the shopping cart
 *     parameters:
 *       - name: cart_id
 *         in: path
 *         required: true
 *         description: Cart ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_id:
 *                 type: string
 *                 description: Product variant ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *             required:
 *               - variant_id
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cart or variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List customer orders
 *     description: Retrieves orders for the authenticated customer
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /store/orders/{order_id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order details
 *     description: Retrieves detailed information for a specific order
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: order_id
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                 redis:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                 s3:
 *                   type: string
 *                   enum: [connected, disconnected]
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                 redis:
 *                   type: string
 *                 s3:
 *                   type: string
 */

export {}
