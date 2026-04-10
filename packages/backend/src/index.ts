/**
 * @copyright 2026 David Shurgold <aomdoa@gmail.com>
 */
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

function response(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  const body = event.body
    ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body)
    : {}

  console.dir(event)
  console.dir(path)
  console.dir(body)

  try {
    return response(200, { message: 'data will go here' })
  } catch (err) {
    console.dir(err)
    return response(500, { message: 'Internal Server Error' })
  }
}
