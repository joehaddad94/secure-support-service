import 'dotenv/config';
import express, { Request, Response } from 'express';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API Running', status: 'ok' });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;