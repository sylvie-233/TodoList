import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import * as Minio from 'minio';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

@Injectable()
export class UploadService {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    this.bucket = configService.get<string>('MINIO_BUCKET', 'todolist');
    this.client = new Minio.Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: false,
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket);
    } catch { this.logger.warn('MinIO not available, using local fallback'); }
  }

  async upload(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, folder: string): Promise<string> {
    const ext = extname(file.originalname);
    const key = `${folder}/${randomUUID()}${ext}`;

    try {
      await this.client.putObject(this.bucket, key, file.buffer, file.size, { 'Content-Type': file.mimetype });
      return `/api/v1/files/${key}`;
    } catch {
      const fs = await import('fs/promises');
      const path = await import('path');
      const dir = path.join(process.cwd(), 'uploads', folder);
      await fs.mkdir(dir, { recursive: true });
      const filename = `${randomUUID()}${ext}`;
      await fs.writeFile(path.join(dir, filename), file.buffer);
      return `/api/v1/files/${folder}/${filename}`;
    }
  }

  async getFileStream(key: string): Promise<{ stream: NodeJS.ReadableStream; mimeType: string } | null> {
    try {
      const stat = await this.client.statObject(this.bucket, key);
      const stream = await this.client.getObject(this.bucket, key);
      return { stream, mimeType: stat.metaData?.['content-type'] || 'application/octet-stream' };
    } catch {
      const fs = await import('fs');
      const path = await import('path');
      const filepath = path.join(process.cwd(), 'uploads', key);
      if (fs.existsSync(filepath)) {
        return {
          stream: fs.createReadStream(filepath),
          mimeType: MIME_MAP[path.extname(key)] || 'application/octet-stream',
        };
      }
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try { await this.client.removeObject(this.bucket, key); } catch { /* ignore */ }
  }
}
