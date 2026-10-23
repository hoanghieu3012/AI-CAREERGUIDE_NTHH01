import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { ActiveQuestionSet } from '../types';
import { OFFICIAL_QUESTION_SET_V1_8 } from '../data/assessmentDataV1_8';

/**
 * Custom hook to fetch active assessment questionnaire from PostgreSQL database (FR02, FR04).
 * Enforces Single Source of Truth, Questionnaire Versioning, and 1-hour staleTime.
 */
export const useAssessmentQuestions = () => {
  return useQuery<ActiveQuestionSet>({
    queryKey: ['assessments', 'active-questions'],
    queryFn: async () => {
      try {
        return await apiRequest<ActiveQuestionSet>('/assessments/active-questions');
      } catch (err) {
        console.warn(
          '[useAssessmentQuestions] Backend network error/offline. Using standard Circular 74/2026/TT-BGDĐT v1.8 fallback:',
          err
        );
        return OFFICIAL_QUESTION_SET_V1_8;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour (3600000 ms) as specified
    gcTime: 1000 * 60 * 60 * 2, // 2 hours in cache
    refetchOnWindowFocus: false,
  });
};
