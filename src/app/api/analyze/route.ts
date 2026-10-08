import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const sentimentSchema = z.object({
  sentiments: z.object({
    joy: z.number().min(0).max(100).describe('기쁨의 강도 백분율 (0-100)'),
    peace: z.number().min(0).max(100).describe('평온/안도감의 강도 백분율 (0-100)'),
    sadness: z.number().min(0).max(100).describe('슬픔의 강도 백분율 (0-100)'),
    anger: z.number().min(0).max(100).describe('분노/짜증의 강도 백분율 (0-100)'),
    anxiety: z.number().min(0).max(100).describe('불안/긴장의 강도 백분율 (0-100)'),
  }),
  dominantEmotion: z.enum(['joy', 'peace', 'sadness', 'anger', 'anxiety']).describe('5개 감정 중 가장 지배적인 핵심 감정'),
  dominantEmotionLabel: z.string().describe('지배적 감정의 한글 명칭 (예: 기쁨, 평온, 슬픔, 분노, 불안)'),
  dominantPercentage: z.number().min(0).max(100).describe('가장 지배적인 감정의 퍼센트 수치'),
  reflectionQuote: z.string().describe('사용자의 마음에 깊이 공감하고 따뜻한 위로와 지지를 건네는 2~3문장의 문구'),
  summaryMetric: z.object({
    label: z.string().describe('감정 요약 라벨 (예: "평온과 안도감", "성취와 충만함", "피로 속 위로")'),
    score: z.number().min(0).max(100).describe('요약 지수 (0-100)'),
  }),
  prescription: z.object({
    title: z.string().describe('처방 제목 (기본값: "내일을 위한 처방")'),
    action: z.string().describe('사용자의 감정 상태에 맞는 실천하기 쉬운 작은 행동/휴식 솔루션 (예: "수면 전 5분 이완 호흡", "따뜻한 차 한 잔과 생각 비우기")'),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const { diaryText } = await req.json();

    if (!diaryText || typeof diaryText !== 'string' || diaryText.trim().length === 0) {
      return NextResponse.json(
        { error: '일기 내용을 입력해 주세요.' },
        { status: 400 }
      );
    }

    const systemPrompt = `
당신은 사람들의 하루 일기를 섬세하게 읽고 마음을 보듬어주는 전문 감성 심리 분석 AI '마음노트'입니다.
주어진 일기 내용을 깊이 분석하여 5가지 핵심 감정(기쁨, 평온, 슬픔, 분노, 불안)의 비율을 산출하고,
가장 지배적인 1가지 감정을 명확히 도출해 주세요.
그리고 지친 하루에 온기가 될 수 있는 깊은 공감의 피드백과, 마음을 편안하게 해 줄 '내일을 위한 처방'을 제안해 주세요.

규칙:
1. 5가지 감정 비율(joy, peace, sadness, anger, anxiety)을 합리적으로 평가하세요. 0~100 사이의 정수로 부여합니다.
2. 가장 대표적인 dominantEmotion 1개를 선택하고 dominantPercentage를 일치시키세요.
3. reflectionQuote는 진심 어린 경청과 지지가 담긴 한국어로 정중하고 따뜻하게(해요체) 작성하세요.
4. prescription.action은 부담 없는 실천 조언(예: 가벼운 스트레칭, 따뜻한 차, 밤 산책 등)을 한 줄로 제시하세요.
`;

    // 쾌속 경량 모델 gemini-3.1-flash-lite 적용
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite-preview',
    ];

    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Connecting to Google Gemini Lite: ${modelName}`);
        const result = await generateObject({
          model: google(modelName),
          schema: sentimentSchema,
          system: systemPrompt,
          prompt: `다음 사용자의 일기를 분석해 주세요:\n\n${diaryText}`,
          maxRetries: 2,
        });

        console.log(`Successfully generated sentiment analysis using: ${modelName}`);
        return NextResponse.json({
          ...result.object,
          usedModel: 'gemini-3.1-flash-lite',
        });
      } catch (err: unknown) {
        console.warn(`Model ${modelName} failed, trying fallback lite model...`, err);
        lastError = err;
      }
    }

    throw lastError || new Error('현재 Google AI 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.');
  } catch (error: unknown) {
    console.error('Sentiment analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: `Gemini 3.1 Flash Lite 감성 분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
