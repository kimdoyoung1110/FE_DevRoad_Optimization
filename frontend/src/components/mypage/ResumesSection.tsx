"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAuthTokens } from "@/lib/auth";
import { useInterviewStore } from "@/store/interviewStore";

interface TechStack {
  id: number;
  name: string;
}

interface Resume {
  resume_id: number;
  resume_title: string;
  resume_url: string;
  tech_stacks: { tech_stack: TechStack }[];
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 4; // 4개씩 보여주기

export default function ResumesSection() {
  const router = useRouter();
  const { setStep, setAnalysisInfo, startProcess, setProgress } = useInterviewStore();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<number | null>(null); // 분석 중인 이력서 ID

  // 페이지 상태 추가
  const [page, setPage] = useState(1);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/resumes/");
      const data = response.data.results || response.data;
      
      if (!Array.isArray(data)) {
        setResumes([]);
        return;
      }
      setResumes(data as Resume[]);
    } catch (err: any) {
      setError(err.response?.data?.error || "이력서 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { accessToken } = getAuthTokens();
    if (accessToken) {
      fetchResumes();
    } else {
      setError("로그인이 필요합니다.");
      setLoading(false);
    }
  }, []);

  // --- 페이징 로직 ---
  const sortedResumes = useMemo(() => {
    // 최신순 정렬
    return [...resumes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [resumes]);

  const totalPages = Math.max(1, Math.ceil(sortedResumes.length / PAGE_SIZE));
  const pagedResumes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedResumes.slice(start, start + PAGE_SIZE);
  }, [sortedResumes, page]);

  // 페이지 이동 시 맨 위로 스크롤 방지 등을 위해 간단히 page set만
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(".pdf", ""));

    try {
      setUploading(true);
      setError(null);
      await api.post("/resumes/", formData);
      alert("이력서가 업로드되었습니다!");
      fetchResumes();
      setPage(1); // 업로드 후 첫 페이지로 이동
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "이력서 업로드에 실패했습니다.";
      setError(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = ""; 
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 이력서를 삭제하시겠습니까?`)) return;

    try {
      setError(null);
      await api.delete(`/resumes/${id}/`);
      alert("이력서가 삭제되었습니다.");
      fetchResumes();
    } catch (err: any) {
      setError(err.response?.data?.error || "이력서 삭제에 실패했습니다.");
    }
  };

  const handleGoToAnalysis = async (id: number) => {
    setAnalyzing(id);
    setError(null);

    try {
      // 1. 이력서 상세 정보 확인 (이미 분석된 데이터가 있는지 체크)
      const response = await api.get(`/resumes/${id}/`);
      const resumeData = response.data;

      // 2. 이미 분석된 데이터가 있으면 바로 결과 페이지로 이동
      const hasTechStacks = resumeData.tech_stacks && resumeData.tech_stacks.length > 0;

      if (hasTechStacks) {
        // 이미 분석 완료된 이력서 - 결과 페이지로 이동
        setStep('result');
        setAnalysisInfo(null, id);
        router.push(`/ai-interview?resumeId=${id}`);
        return;
      }

      // 3. 분석된 데이터가 없으면 분석 시작
      setStep('analyzing');
      startProcess('AI 정밀 분석 중...');
      setProgress(35);

      // 4. 이력서 분석 API 호출
      const analyzeResponse = await api.post(`/resumes/${id}/analyze/`);

      // 5. task_id와 resumeId를 스토어에 저장
      setAnalysisInfo(analyzeResponse.data.task_id, id);
      setProgress(40);

      // 6. AI 인터뷰 페이지로 이동 (분석 진행 화면 표시됨)
      router.push(`/ai-interview?resumeId=${id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "이력서 확인에 실패했습니다.";
      setError(errorMessage);
      alert(errorMessage);
      // 에러 발생 시 상태 초기화
      setStep('empty');
      setProgress(0);
    } finally {
      setAnalyzing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-zinc-400">이력서 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-50">이력서 관리</h2>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            {resumes.length} / 10
          </span>
        </div>
        
        <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all active:scale-95 ${
          uploading ? "bg-zinc-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}>
          {uploading ? "업로드 중..." : "+ 이력서 업로드"}
          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 animate-pulse">
          ⚠️ {error}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 text-zinc-400 text-sm">
          <svg className="mb-4 h-10 w-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>업로드된 이력서가 없습니다.</p>
          <p className="mt-1 text-xs text-zinc-500">PDF 파일을 업로드하여 AI 분석을 시작하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagedResumes.map((resume) => (
            <div
              key={resume.resume_id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-400 shrink-0">
                    <span className="text-xs font-bold">PDF</span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-zinc-100">{resume.resume_title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-zinc-500">
                        {new Date(resume.created_at).toLocaleDateString("ko-KR")}
                      </p>
                      {resume.tech_stacks?.length > 0 && (
                        <>
                          <span className="h-3 w-[1px] bg-zinc-700"></span>
                          <div className="flex gap-1.5 overflow-hidden">
                            {resume.tech_stacks.slice(0, 3).map((ts) => (
                              <span key={ts.tech_stack.id} className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                                {ts.tech_stack.name}
                              </span>
                            ))}
                            {resume.tech_stacks.length > 3 && (
                              <span className="text-[10px] text-zinc-500">+{resume.tech_stacks.length - 3}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-4">
                <button
                  onClick={() => handleGoToAnalysis(resume.resume_id)}
                  disabled={analyzing === resume.resume_id}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 whitespace-nowrap ${
                    analyzing === resume.resume_id
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {analyzing === resume.resume_id ? (
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      확인 중...
                    </span>
                  ) : resume.tech_stacks && resume.tech_stacks.length > 0 ? (
                    "AI 분석 결과"
                  ) : (
                    "AI 분석 시작"
                  )}
                </button>
                <button
                  onClick={() => handleDelete(resume.resume_id, resume.resume_title)}
                  disabled={analyzing === resume.resume_id}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
                    analyzing === resume.resume_id
                      ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                      : "bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                  }`}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 버튼 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                p === page 
                  ? "bg-zinc-100 text-zinc-900" 
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {p}
            </button>
          ))}

        </div>
      )}

      {/* 안내 문구 */}
      <div className="mt-8 rounded-xl bg-blue-900/10 p-4 text-xs text-blue-200/80 border border-blue-500/10">
        <p className="font-semibold mb-1 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip
        </p>
        <ul className="ml-6 list-disc space-y-1 text-zinc-400">
          <li>이력서를 업로드하면 'AI 분석 시작' 버튼이 표시됩니다. 클릭하여 면접 질문 예측 및 역량 분석을 시작하세요.</li>
          <li>AI 인터뷰 페이지에서 채용 공고별 세부 분석과 예상 면접 질문을 확인할 수 있습니다.</li>
          <li>최대 10개까지 이력서를 저장할 수 있습니다. 오래된 이력서는 주기적으로 정리해주세요.</li>
        </ul>
      </div>
    </div>
  );
}