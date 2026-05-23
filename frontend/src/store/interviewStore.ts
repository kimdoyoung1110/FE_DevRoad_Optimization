import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProcessStatus = 'idle' | 'loading' | 'success';

interface InterviewState {
  step: 'empty' | 'analyzing' | 'result';
  taskId: string | null;
  analyzingResumeId: number | null;
  
  navStatus: ProcessStatus;
  navMessage: string;
  
  // ✅ [추가] 진행률 상태 (0 ~ 100)
  progress: number; 

  setStep: (step: 'empty' | 'analyzing' | 'result') => void;
  setAnalysisInfo: (taskId: string | null, resumeId: number | null) => void;
  
  startProcess: (message: string) => void;
  // ✅ [추가] 진행률 업데이트 함수
  setProgress: (value: number) => void; 
  completeProcess: () => void;
  resetProcess: () => void;
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      step: 'empty',
      taskId: null,
      analyzingResumeId: null,
      navStatus: 'idle',
      navMessage: '',
      progress: 0, // 초기값

      setStep: (step) => set({ step }),
      setAnalysisInfo: (taskId, analyzingResumeId) => set({ taskId, analyzingResumeId }),

      startProcess: (message) => set({ navStatus: 'loading', navMessage: message, progress: 0 }),
      
      // ✅ 진행률 업데이트 (최대 100까지만)
      setProgress: (value) => set({ progress: Math.min(value, 100) }),

      completeProcess: () => {
        set({ navStatus: 'success', navMessage: '완료되었습니다!', progress: 100 });
        setTimeout(() => {
            // 완료 후 상태 정리
            set({ navStatus: 'idle', navMessage: '' }); 
        }, 5000);
      },

      resetProcess: () => set({ 
        step: 'empty', 
        taskId: null, 
        analyzingResumeId: null, 
        navStatus: 'idle', 
        navMessage: '',
        progress: 0 
      }),
    }),
    {
      name: 'interview-storage',
      partialize: (state) => ({ 
        step: state.step, 
        taskId: state.taskId, 
        analyzingResumeId: state.analyzingResumeId 
      }),
    }
  )
);