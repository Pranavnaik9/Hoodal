import { Request, Response } from 'express';

export class UploadController {
    async uploadImage(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        res.status(201).json({
            success: true,
            imageUrl,
            filename: req.file.filename,
        });
    }
}

export const uploadController = new UploadController();
