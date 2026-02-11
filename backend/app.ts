/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import processesRoutes from './routes/processes.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/processes', processesRoutes)

import { supabase } from './lib/supabase.js';

/**
 * health
 */
app.use(
  '/api/health',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Simple check to database
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            throw error;
        }
        res.status(200).json({
          success: true,
          message: 'ok',
          database: 'connected'
        });
    } catch (e: any) {
        res.status(503).json({
            success: false,
            message: 'service unavailable',
            error: e.message
        });
    }
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
