
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, TrendingUp, BarChart3, Info, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { AnalysisResponse } from './types';

const App: React.FC = () => {
  const [stockName, setStockName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!stockName.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        당신은 RSI와 MACD 개발자의 원리를 깊이 이해한 모멘텀 분석 전문가입니다.
        분석 대상: ${stockName}
        
        지시사항:
        1. Google Search를 통해 ${stockName}의 실시간 RSI(14), MACD(12,26,9), 스토캐스틱(20,10,10) 지표값과 현재가를 조회하세요.
        2. 반드시 "가격 표기 원칙"을 준수하세요. 모든 지표값에는 해당 시점의 주가를 병기해야 합니다.
        3. 아래 출력 형식을 엄격히 따르세요. 마크다운 테이블을 사용하세요.
        4. 네이버 금융 또는 최신 신뢰할 수 있는 금융 데이터를 참조하세요.

        [출력 형식 가이드]
        📈 모멘텀 지표 심층 분석 결과
        ---
        [종목명] (일봉 기준)
        📍 현재가: ￦[가격]

        1. RSI (14) 분석
        - 테이블: 항목, 값, 해당 시점 주가, 해석
        - 다이버전스 분석 섹션 (상승/하락 여부 및 가격 변화 포함)

        2. MACD (12, 26, 9) 분석
        - 테이블: 항목, 값, 해석 (MACD선, 시그널선, 히스토그램, 제로라인)
        - MACD 신호 분석 섹션 (골든/데드크로스, 제로라인 돌파, 발생일 주가 필수)

        3. 스토캐스틱 (20, 10, 10) 분석
        - 테이블: 항목, 값, 해석
        - 신호 테이블 (%K/%D 돌파, 20이하 상향, 80이상 하향 반전 등)

        🎯 모멘텀 종합 판단
        - 요약 테이블 (현재가, RSI, MACD, 스토캐스틱, 종합 신호, 신뢰도)

        📝 최종 요약 (문장형): [상세 요약 및 전략 제시]
        💡 다이버전스 경고: [특이사항 기술]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const text = response.text || "분석 결과를 생성할 수 없습니다.";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web!.title, uri: chunk.web!.uri }));

      setAnalysis({ text, sources });
    } catch (err: any) {
      console.error(err);
      setError("데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600 w-8 h-8" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">모멘텀 분석 전문가</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Info size={14} /> RSI/MACD/STOCH</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Search Section */}
        <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">실시간 기술적 분석</h2>
            <p className="opacity-90 text-sm md:text-base">
              종목명이나 종목 코드를 입력하시면 RSI, MACD, 스토캐스틱을 분석하여 최적의 매매 타이밍을 진단해 드립니다.
            </p>
          </div>
          
          <form onSubmit={performAnalysis} className="p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="분석할 종목명을 입력하세요 (예: 삼성전자, 테슬라, BTC)"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !stockName}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 px-10 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    심층 분석 시작
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Loading State Overlay */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="bg-white p-8 rounded-full shadow-lg mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <p className="text-slate-600 font-medium">네이버 금융 및 최신 차트 데이터를 분석하고 있습니다...</p>
            <p className="text-slate-400 text-sm mt-1">이 작업은 약 10~20초 정도 소요될 수 있습니다.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-bold mb-1">오류 발생</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 md:p-10">
              <article className="prose prose-slate max-w-none prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:p-3 prose-td:p-3 prose-th:text-slate-700 prose-td:text-slate-600 prose-headings:text-slate-800 prose-hr:border-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analysis.text}
                </ReactMarkdown>
              </article>

              {analysis.sources.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ExternalLink size={14} /> 분석 근거 및 출처
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysis.sources.map((source, idx) => (
                      <li key={idx}>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 overflow-hidden"
                        >
                          <span className="truncate">{source.title || source.uri}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Trading Tip */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 flex items-start gap-4">
              <Info className="text-amber-600 w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="text-amber-900 font-bold mb-1">투자의 유의사항</h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  본 분석 결과는 인공지능이 제공하는 기술적 참고 자료일 뿐이며, 투자 결과에 대한 법적 책임을 지지 않습니다. 
                  모멘텀 지표는 급격한 시장 변동성에서 오류가 발생할 수 있으므로 거래량 및 뉴스 재료와 함께 판단하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {!analysis && !isLoading && !error && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="text-slate-400 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">분석 대기 중</h3>
            <p className="text-slate-500">종목명을 입력하고 웰스 와일더와 제럴드 아펠의 원리가 적용된<br/>심층 모멘텀 분석을 받아보세요.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 Momentum Pro Expert Analysis. Built with Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
