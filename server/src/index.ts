import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import playerRoutes from './routes';
import { db } from './database/drizzle';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
console.log("db url: ", process.env.DATABASE_URL)
const port = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api/players', playerRoutes);

app.get('/api/health', async(req, res) => {
  const testResult = await db.execute(`SELECT 1 as test`);
    console.log('Connection test:', testResult);
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
