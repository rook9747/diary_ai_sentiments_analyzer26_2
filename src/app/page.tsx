'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Bookmark,
  RotateCcw,
  Sparkles,
  Flower2,
  CheckCircle2,
  Loader2,
  Smile,
  Save,
  Heart,
} from 'lucide-react';

// 5개 감성 인터페이스 정의
export type EmotionKey = 'joy' | 'peace' | 'sadness' | 'anger' | 'anxiety';

export interface EmotionItem {
  key: EmotionKey;
  label: string;
  emoji: string;
  percentage: number;
  bgLight: string;
  bgActive: string;
  borderColor: string;
  textColor: string;
  activeBorderColor: string;
}

export interface AnalysisResult {
  sentiments: {
    joy: number;
    peace: number;
    sadness: number;
    anger: number;
    anxiety: number;
  };
  dominantEmotion: EmotionKey;
  dominantEmotionLabel: string;
  dominantPercentage: number;
  reflectionQuote: string;
  summaryMetric: {
    label: string;
    score: number;
  };
  prescription: {
    title: string;
    action: string;
  };
  usedModel?: string;
}

const EMOTIONS_CONFIG: Record<
  EmotionKey,
  {
    label: string;
    emoji: string;
    bgLight: string;
    bgActive: string;
    borderColor: string;
    activeBorderColor: string;
    textColor: string;
    pillBg: string;
    pillText: string;
  }
> = {
  joy: {
    label: '기쁨',
    emoji: '😄',
    bgLight: 'bg-[#FFF9EE]',
    bgActive: 'bg-[#FFE8B6]',
    borderColor: 'border-[#F8E7C4]',
    activeBorderColor: 'border-[#F0C968] ring-2 ring-[#FAD074]/60',
    textColor: 'text-[#755900]',
    pillBg: 'bg-[#FFE8B6]',
    pillText: 'text-[#755900]',
  },
  peace: {
    label: '평온',
    emoji: '😌',
    bgLight: 'bg-[#F2FAF6]',
    bgActive: 'bg-[#A3EED1]',
    borderColor: 'border-[#D4EFE4]',
    activeBorderColor: 'border-[#48D59E] ring-2 ring-[#48D59E]/60',
    textColor: 'text-[#165B42]',
    pillBg: 'bg-[#C1F4E1]',
    pillText: 'text-[#165B42]',
  },
  sadness: {
    label: '슬픔',
    emoji: '😢',
    bgLight: 'bg-[#F5F8FF]',
    bgActive: 'bg-[#DDE5FF]',
    borderColor: 'border-[#DCE4FA]',
    activeBorderColor: 'border-[#9CB4FF] ring-2 ring-[#9CB4FF]/60',
    textColor: 'text-[#29437E]',
    pillBg: 'bg-[#DDE5FF]',
    pillText: 'text-[#29437E]',
  },
  anger: {
    label: '분노',
    emoji: '😡',
    bgLight: 'bg-[#FFF5F4]',
    bgActive: 'bg-[#FFDAD7]',
    borderColor: 'border-[#FCE1DF]',
    activeBorderColor: 'border-[#FF9C94] ring-2 ring-[#FF9C94]/60',
    textColor: 'text-[#93000E]',
    pillBg: 'bg-[#FFDAD7]',
    pillText: 'text-[#93000E]',
  },
  anxiety: {
    label: '불안',
    emoji: '😰',
    bgLight: 'bg-[#FAF4FD]',
    bgActive: 'bg-[#F4DDFF]',
    borderColor: 'border-[#F0E0F7]',
    activeBorderColor: 'border-[#D99EFF] ring-2 ring-[#D99EFF]/60',
    textColor: 'text-[#6E3987]',
    pillBg: 'bg-[#F4DDFF]',
    pillText: 'text-[#6E3987]',
  },
};

export default function Home() {
  const [diaryText, setDiaryText] = useState('');
  const [selectedDate] = useState<Date>(new Date());
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 토스트 메시지 헬퍼
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // 날짜 포맷 (년, 월, 일, 요일)
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayOfWeek = dayNames[date.getDay()];
    return `${year}년 ${month}월 ${day}일 ${dayOfWeek}`;
  };

  // 임시 저장
  const handleSaveDraft = () => {
    if (!diaryText.trim()) {
      showToast('작성된 일기 내용이 없습니다.');
      return;
    }
    try {
      localStorage.setItem('mind_note_draft', diaryText);
      showToast('임시 저장이 완료되었습니다.');
    } catch {
      showToast('임시 저장을 완료했습니다.');
    }
  };

  // 재시작 (일기 작성 초기화 & 분석 결과 숨김)
  const handleReset = () => {
    setDiaryText('');
    setAnalysisResult(null);
    showToast('일기 작성이 초기화되었습니다.');
  };

  // Gemini 감성 분석 실행
  const handleAnalyze = async () => {
    if (!diaryText.trim()) {
      showToast('일기 내용을 먼저 작성해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaryText }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '분석 요청에 실패했습니다.');
      }

      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      showToast('Gemini 감성 분석이 완료되었습니다!');
    } catch (err: unknown) {
      console.error(err);
      const rawMsg = err instanceof Error ? err.message : '';
      const errMsg = rawMsg.includes('high demand') || rawMsg.includes('503')
        ? '일시적인 서버 혼잡 상태입니다. 다시 한 번 분석 버튼을 눌러주세요.'
        : rawMsg || '분석 중 오류가 발생했습니다.';
      showToast(`분석 실패: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const dominantEmotion = analysisResult?.dominantEmotion;
  const dominantConfig = dominantEmotion ? EMOTIONS_CONFIG[dominantEmotion] : null;

  return (
    <div className="min-h-screen bg-[#FAF6FC] text-[#1E1B22] flex flex-col justify-between selection:bg-[#E2DEFA] selection:text-[#4A3ACB]">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1E1B22]/90 text-white text-sm px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 네비게이션 헤더 */}
      <header className="w-full max-w-[1040px] mx-auto pt-8 pb-4 px-4 sm:px-6 flex flex-col items-center gap-3">
        {/* 서비스 타이틀 */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B22] text-center">
          ai 일기 감성 분석
        </h1>

        {/* 날짜 표시 영역 (날짜만 표시) */}
        <div className="flex items-center gap-2 bg-white/90 border border-[#EDE5F2] rounded-full px-4 py-1.5 shadow-xs text-xs sm:text-sm text-[#1E1B22] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[#6356E5]" />
          <span>{formatDate(selectedDate)}</span>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 flex-1 flex flex-col gap-6 py-2">
        {/* 1. 일기 작성 카드 */}
        <div className="bg-white rounded-2xl border border-[#EDE5F2] shadow-[0_4px_20px_rgba(99,86,229,0.04)] p-5 sm:p-7 transition-all">
          {/* 오른쪽 상단 저장 버튼 */}
          <div className="flex justify-end pb-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#6356E5] hover:bg-[#5043CB] active:scale-95 rounded-xl transition-all shadow-sm shadow-[#6356E5]/25 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              저장
            </button>
          </div>

          {/* 텍스트 입력 영역 */}
          <div className="relative">
            <textarea
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              placeholder="오늘 어떤 하루를 보내셨나요? 사소한 순간, 느꼈던 감정, 생각들을 편안하게 적어보세요..."
              rows={6}
              className="w-full resize-none border-0 p-1 text-[15px] sm:text-base leading-relaxed text-[#2B2730] placeholder-[#A49EAE] focus:outline-none focus:ring-0 font-normal selection:bg-[#E2DEFA]"
            />
          </div>

          {/* 하단 액션 버튼 그룹 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F5EDF9] mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#5B5565] bg-[#F5EDF9] hover:bg-[#EBE2EF] rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#7B7584]" />
                임시 저장
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#5B5565] bg-[#F5EDF9] hover:bg-[#EBE2EF] rounded-xl transition-all active:scale-95 cursor-pointer"
                title="일기 작성 내용을 모두 지우고 초기화합니다"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#7B7584]" />
                재시작
              </button>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading || !diaryText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-[#6356E5] hover:bg-[#5043CB] active:scale-95 transition-all shadow-md shadow-[#6356E5]/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Gemini 3.1 Flash Lite 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Gemini 감성 분석</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. 감성 스펙트럼 카드 (AI 분석 완료 시 표시) */}
        {analysisResult && dominantConfig && (
          <div className="bg-white rounded-2xl border border-[#EDE5F2] shadow-[0_4px_20px_rgba(99,86,229,0.04)] p-5 sm:p-7 transition-all duration-500 animate-fadeIn">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base sm:text-lg font-bold text-[#1E1B22] flex items-center gap-2">
                감성 스펙트럼
              </h2>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${dominantConfig.pillBg} ${dominantConfig.pillText} transition-all duration-300 shadow-xs`}
              >
                주요 감정: {analysisResult.dominantEmotionLabel} ({analysisResult.dominantPercentage}%)
              </span>
            </div>

            {/* 5개 감성 카드 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3.5">
              {(
                [
                  { key: 'joy', label: '기쁨', emoji: '😄' },
                  { key: 'peace', label: '평온', emoji: '😌' },
                  { key: 'sadness', label: '슬픔', emoji: '😢' },
                  { key: 'anger', label: '분노', emoji: '😡' },
                  { key: 'anxiety', label: '불안', emoji: '😰' },
                ] as const
              ).map((item) => {
                const isDominant = analysisResult.dominantEmotion === item.key;
                const percentage = analysisResult.sentiments[item.key] ?? 0;
                const cfg = EMOTIONS_CONFIG[item.key];

                return (
                  <div
                    key={item.key}
                    className={`relative flex flex-col items-center justify-center py-4 px-2 rounded-xl transition-all duration-300 cursor-default ${
                      isDominant
                        ? `${cfg.bgActive} ${cfg.activeBorderColor} border-2 shadow-sm scale-102 sm:scale-105 z-10`
                        : `${cfg.bgLight} ${cfg.borderColor} border hover:border-[#D6CADB]`
                    }`}
                  >
                    {/* 지배적 감정 강조 뱃지 */}
                    {isDominant && (
                      <span className="absolute -top-2.5 bg-[#1E1B22] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                        DOMINANT
                      </span>
                    )}

                    {/* 이모지 */}
                    <span
                      className={`text-2xl sm:text-3xl mb-1.5 transition-transform duration-300 ${
                        isDominant ? 'scale-115' : ''
                      }`}
                    >
                      {item.emoji}
                    </span>

                    {/* 감정명 */}
                    <span
                      className={`text-xs sm:text-sm font-semibold mb-0.5 ${
                        isDominant ? cfg.textColor : 'text-[#3E3846]'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* 퍼센트 */}
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-medium ${
                        isDominant ? cfg.textColor : 'text-[#7B7584]'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. AI 감성 분석 결과 리포트 (AI 분석 완료 시 표시, 공유 버튼 삭제) */}
        {analysisResult && (
          <div className="bg-white rounded-2xl border border-[#EDE5F2] shadow-[0_4px_20px_rgba(99,86,229,0.04)] p-5 sm:p-7 transition-all duration-500 animate-fadeIn">
            {/* 리포트 헤더 */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EDF9] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#6356E5] flex items-center justify-center text-white shadow-xs">
                  <Flower2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-[#1E1B22]">
                    AI 감성 분석 리포트
                  </h3>
                  <span className="bg-[#6356E5]/10 text-[#6356E5] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Gemini 3.1 Flash Lite
                  </span>
                </div>
              </div>
            </div>

            {/* 마음노트의 따뜻한 공감 박스 */}
            <div className="bg-[#FBF8FE] border border-[#F0E6F6] rounded-xl p-4 sm:p-5 mb-5 relative">
              <div className="flex items-center gap-1.5 text-[#6356E5] text-xs sm:text-sm font-bold mb-2">
                <Smile className="w-4 h-4 text-[#6356E5]" />
                <span>마음노트의 따뜻한 공감</span>
              </div>
              <p className="text-sm sm:text-[15px] leading-relaxed text-[#2B2730] font-normal whitespace-pre-line">
                {analysisResult.reflectionQuote}
              </p>
            </div>

            {/* 하단 2개 메트릭 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 왼쪽: 주요 감정 요약 게이지 바 */}
              <div className="bg-[#F8F5FB] border border-[#EDE5F2] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#2D2A32] mb-2.5">
                  <span>{analysisResult.summaryMetric.label}</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {analysisResult.summaryMetric.score}%
                  </span>
                </div>
                {/* 프로그레스 바 */}
                <div className="w-full bg-[#E5DFEA] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${analysisResult.summaryMetric.score}%` }}
                  />
                </div>
              </div>

              {/* 오른쪽: 내일을 위한 처방 */}
              <div className="bg-[#F8F5FB] border border-[#EDE5F2] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#2D2A32] mb-2.5">
                  <span className="text-[#645E6E]">{analysisResult.prescription.title}</span>
                  <span className="text-[#843A24] font-medium text-xs sm:text-sm">
                    {analysisResult.prescription.action}
                  </span>
                </div>
                {/* 웜 코랄 바 */}
                <div className="w-full bg-[#E5DFEA] rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#843A24] h-full rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 푸터 영역 */}
      <footer className="w-full border-t border-[#EDE5F2] bg-gradient-to-b from-transparent via-white/40 to-white/80 backdrop-blur-xs mt-12 py-8 px-4 sm:px-6">
        <div className="max-w-[1040px] mx-auto flex flex-col items-center justify-center text-center gap-3">
          {/* 상단 브랜드 태그 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6356E5]/8 border border-[#6356E5]/15 text-[#6356E5] text-[11px] font-medium tracking-wide">
            <Sparkles className="w-3 h-3 text-[#6356E5]" />
            <span>Diary AI Sentiments Analyzer</span>
          </div>

          {/* 감성 서브 카피 */}
          <p className="text-xs text-[#7B7584] max-w-[480px] leading-relaxed">
            하루의 소중한 감정을 마주하고 마음을 보듬는 지능형 감성 일기 분석 서비스
          </p>

          {/* 미니 구분선 */}
          <div className="w-12 h-px bg-[#EDE5F2] my-0.5" />

          {/* 카피라이트 */}
          <p className="text-[11px] sm:text-xs text-[#958E9E] font-medium tracking-tight">
            Copyright INU Diary AI Sentiments Analyzer by KYUNGROK KIM
          </p>
        </div>
      </footer>
    </div>
  );
}
