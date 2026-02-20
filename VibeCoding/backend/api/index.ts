import type { IncomingMessage, ServerResponse } from 'http';
import { getServerlessExpressApp } from '../src/server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getServerlessExpressApp();
  // Express instance is a function (req, res) => void
  return (app as any)(req, res);
}



