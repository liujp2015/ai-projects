import type { IncomingMessage, ServerResponse } from 'http';
import { getServerlessExpressApp } from '../src/server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getServerlessExpressApp();
    // Express instance is a function (req, res) => void
    return app(req, res);
  } catch (error: any) {
    console.error('Serverless Function Error:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error?.message || 'Unknown error',
      }));
    }
  }
}



