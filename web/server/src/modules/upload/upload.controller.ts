import {
  Controller, Post, Get, Param, Delete, UseInterceptors,
  UploadedFile, Res, HttpException, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadService } from './upload.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('files')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** 上传图片 */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    if (!file.mimetype.startsWith('image/')) {
      throw new HttpException('Only images allowed', HttpStatus.BAD_REQUEST);
    }
    const url = await this.uploadService.upload(file, 'images');
    return { url };
  }

  /** 查看/下载图片 */
  @Public()
  @Get('images/:key')
  async getImage(@Param('key') key: string, @Res() res: Response) {
    const result = await this.uploadService.getFileStream(`images/${key}`);
    if (!result) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    res.set({ 'Content-Type': result.mimeType, 'Cache-Control': 'max-age=86400' });
    result.stream.pipe(res);
  }

  /** 删除图片 */
  @Delete('images/:key')
  async deleteImage(@Param('key') key: string) {
    await this.uploadService.delete(`images/${key}`);
    return { message: 'Deleted' };
  }
}
