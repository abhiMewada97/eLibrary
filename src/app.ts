import express from 'express'
import globalErrorHandler from './middlewares/globalErrorHandler';
import userRouter from './user/userRouter';
import bookRouter from './book/bookRouter';
import cors from 'cors'
import { config } from './config/config';

const app = express();

// app.use(cors());   //allow all
app.use(            //specific
    cors({
        origin: config.frontendDomain,
    })
)

app.use(express.json());

app.get("/", (req, res) => {

    res.json({message: "Welcome"});
});

app.use('/api/users', userRouter);

app.use('/api/books', bookRouter);

// Global error handler
app.use(globalErrorHandler);

export default app;