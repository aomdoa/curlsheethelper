/**
 * @copyright 2026 David Shurgold <aomdoa@gmail.com>
 */
import express from 'express'
import { handler } from '../src/index'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'

const app = express()
app.use(express.json())

app.all('{*path}', async (req, res) => {
  const body = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : undefined

  const event: Partial<APIGatewayProxyEventV2> = {
    requestContext: {
      http: {
        method: req.method,
        path: req.path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: req.headers['user-agent'] ?? '',
      },
      accountId: 'local',
      apiId: 'local',
      authorizer: undefined,
      domainName: 'localhost',
      domainPrefix: 'local',
      requestId: 'local',
      routeKey: '$default',
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    rawPath: req.path,
    rawQueryString: '',
    headers: req.headers as Record<string, string>,
    isBase64Encoded: false,
    body,
  }

  const result = await handler(event as APIGatewayProxyEventV2)
  const typedResult = result as { statusCode: number; headers?: Record<string, string>; body?: string }

  if (typedResult.headers) {
    Object.entries(typedResult.headers).forEach(([key, value]) => res.setHeader(key, value))
  }
  res.status(typedResult.statusCode).send(typedResult.body ? JSON.parse(typedResult.body) : {})
})

const PORT = process.env.PORT ?? 5005
app.listen(PORT, () => console.log(`Lambda running locally on http://localhost:${PORT}`))
