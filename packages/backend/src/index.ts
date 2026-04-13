/**
 * @copyright 2026 David Shurgold <aomdoa@gmail.com>
 */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import processCsv, { RawCurlConfig } from './process'

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event?.requestContext?.http?.method
  if (!method) {
    console.error('Unexpected event shape:', JSON.stringify(event, null, 2))
    throw new Error('Missing HTTP method')
  } else if (method === 'OPTIONS') {
    console.log('Received OPTIONS request, returning 200 for CORS preflight')
    return response(200, {})
  }

  const path = event.rawPath
  if (event.body === undefined) {
    return response(400, { message: 'Missing request body' })
  }

  try {
    const body = JSON.parse(
      event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body
    ) as RawCurlConfig
    if (path === '/teams') {
      const result = processCsv(body)
      return response(200, { result, message: 'success' })
    }
    return response(404, { message: 'Not Found' })
  } catch (err) {
    const error = err as Error
    console.dir(error)
    return response(400, { message: error.message })
  }
}
