import { OpenAIEmbeddings } from '@langchain/openai';

async function main() {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: 'sk-hgazuvoxfwrcpzparcqfrgaposrblibngqruecehebfpyeeh',
      configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',
      },
      modelName: 'BAAI/bge-m3',
    });
    const res = await embeddings.embedDocuments(['test 1', 'test 2', 'test 3']);
    console.log('Success:', res.length);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
