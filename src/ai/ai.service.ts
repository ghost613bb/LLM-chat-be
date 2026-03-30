import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BASE_URL } from 'src/constant';
import { isImageByExtension } from 'src/util';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private defaultMessage = 'you are a helpful assistant';

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      // 若没有配置环境变量，请用阿里云百炼API Key将下行替换为：apiKey: "sk-xxx",
      apiKey: this.configService.get<string>('LLM_API_KEY'),
      baseURL: this.configService.get<string>('LLM_BASE_URL'),
    });
  }

  async getAiWithFile(filePath: string) {
    // 将URL路径转换为本地文件系统路径
    let localFilePath = filePath;

    if (filePath.startsWith(BASE_URL)) {
      // 如果是完整URL，移除BASE_URL部分
      localFilePath = filePath.replace(BASE_URL, '');
    }

    if (localFilePath.startsWith('/uploads/')) {
      // 如果是相对URL路径，转换为绝对本地路径
      localFilePath = path.join(
        process.cwd(),
        localFilePath.replace(/^\//, ''),
      );
    } else if (localFilePath.startsWith('uploads/')) {
      // 如果已经移除了前导斜杠，直接拼接
      localFilePath = path.join(process.cwd(), localFilePath);
    }

    // 确保路径使用正确的分隔符
    localFilePath = path.normalize(localFilePath);

    console.log('转换后的本地路径:', localFilePath);

    const fileObject = await this.openai.files.create({
      file: fs.createReadStream(localFilePath),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      purpose: 'file-extract' as any,
    });

    const res = `fileid://${fileObject.id}`;
    return res;
  }

  async getAiWithMessage() {}

  getAiWithImg(message: string, imgUrl: string) {
    const imgContent: {
      type: 'image_url';
      image_url: { url: string };
    } = {
      type: 'image_url',
      image_url: { url: imgUrl },
    };
    // imgUrl.map((item) => {

    // });

    const messageContent: {
      type: 'text';
      text: string;
    } = {
      type: 'text',
      text: message,
    };

    return [messageContent, imgContent];
  }

  async getMain(message: string, filePath: string, imgUrl?: string[]) {
    const isImage = isImageByExtension(filePath);
    const model = isImage ? 'qwen-vl-plus' : this.configService.get<string>('LLM_MODEL_NAME') || 'qwen-long';

    const content = filePath
      ? await this.getAiWithFile(filePath)
      : this.defaultMessage;

    const userContent = isImage
      ? this.getAiWithImg(message, filePath)
      : message;

    const completion = await this.openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: content },
        { role: 'user', content: userContent },
      ],
      stream: true,
      stream_options: {
        include_usage: true,
      },
    });

    return completion;
  }
}
