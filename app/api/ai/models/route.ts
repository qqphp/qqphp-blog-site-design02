import { getLanguageModels } from '@/lib/aa-models';
import { json } from '@/lib/admin-auth';

export async function GET() {
  try {
    return json(await getLanguageModels());
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : '大模型数据暂不可用，请稍后重试。',
      },
      503,
    );
  }
}
