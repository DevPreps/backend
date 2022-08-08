import { ErrorRequestHandler, Request, Response } from "express";

const errorHandler =
    (): ErrorRequestHandler => (err: Error, req: Request, res: Response) => {
        // Only log an error to the console if run in development mode
        if (process.env["NODE_ENV"] === "development") {
            console.error(err);
        }

        return res.status(500).json({
            status: "error",
            message: err.message,
        });
    };

export default errorHandler;
