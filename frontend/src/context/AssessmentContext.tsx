import React, { createContext, useContext, useState, useEffect } from 'react';
import { RIASECVector, QAPersonaPreset, AssessmentSubmissionResult } from '../types';
import { assessmentService } from '../services/careerServices';
import { useAuth } from './AuthContext';
import {
  getScopedItem,
  setScopedItem,
  removeScopedItem,
} from '../utils/userStorage';

interface AssessmentContextType {
  riasecAnswers: Record<string, number>;
  cognitiveAnswers: Record<string, string>;
  setRiasecAnswer: (questionCode: string, value: number) => void;
  setCognitiveAnswer: (dimensionOrCode: string, value: string) => void;
  applyQAPreset: (preset: QAPersonaPreset) => void;
  xpPoints: number;
  streakDays: number;
  calculatedVector: RIASECVector | null;
  dominantTraits: string[];
  submitAssessment: () => Promise<AssessmentSubmissionResult>;
  isSubmitting: boolean;
  isCompleted: boolean;
  resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [riasecAnswers, setRiasecAnswers] = useState<Record<string, number>>(() => {
    const draft = assessmentService.getLocalDraft(userId);
    return (draft?.answers as Record<string, number>) || {};
  });

  const [cognitiveAnswers, setCognitiveAnswers] = useState<Record<string, string>>(() => {
    const draft = assessmentService.getLocalDraft(userId);
    return draft?.preferences || {};
  });

  const [calculatedVector, setCalculatedVector] = useState<RIASECVector | null>(() => {
    const saved = getScopedItem('calculated_vector', userId);
    return saved ? JSON.parse(saved) : null;
  });

  const [dominantTraits, setDominantTraits] = useState<string[]>(() => {
    const saved = getScopedItem('dominant_traits', userId);
    return saved ? JSON.parse(saved) : [];
  });

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return getScopedItem('assessment_completed', userId) === 'true';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [streakDays] = useState<number>(1);

  // Dynamic XP: +25 XP per answered question (up to 38 items = 950 XP) + 200 completion bonus = 1150 XP
  const answeredCount = Object.keys(riasecAnswers).length + Object.keys(cognitiveAnswers).length;
  const [xpPoints, setXpPoints] = useState<number>(() => {
    return answeredCount * 25 + (isCompleted ? 200 : 0);
  });

  // Reactive reload whenever active user changes (login, logout, new registration)
  useEffect(() => {
    const draft = assessmentService.getLocalDraft(userId);
    const loadedRiasec = (draft?.answers as Record<string, number>) || {};
    const loadedCognitive = draft?.preferences || {};
    setRiasecAnswers(loadedRiasec);
    setCognitiveAnswers(loadedCognitive);

    const savedVector = getScopedItem('calculated_vector', userId);
    setCalculatedVector(savedVector ? JSON.parse(savedVector) : null);

    const savedTraits = getScopedItem('dominant_traits', userId);
    setDominantTraits(savedTraits ? JSON.parse(savedTraits) : []);

    const savedCompleted = getScopedItem('assessment_completed', userId) === 'true';
    setIsCompleted(savedCompleted);

    const count = Object.keys(loadedRiasec).length + Object.keys(loadedCognitive).length;
    setXpPoints(count * 25 + (savedCompleted ? 200 : 0));
  }, [userId]);

  // Auto-save draft on answers change (scoped per active user)
  useEffect(() => {
    if (answeredCount > 0) {
      assessmentService.saveLocalDraft(riasecAnswers, cognitiveAnswers, userId);
    }
    setXpPoints(answeredCount * 25 + (isCompleted ? 200 : 0));
  }, [riasecAnswers, cognitiveAnswers, answeredCount, isCompleted, userId]);

  const setRiasecAnswer = (questionCode: string, value: number) => {
    setRiasecAnswers((prev) => ({
      ...prev,
      [questionCode]: value,
    }));
  };

  const setCognitiveAnswer = (dimensionOrCode: string, value: string) => {
    setCognitiveAnswers((prev) => ({
      ...prev,
      [dimensionOrCode]: value,
    }));
  };

  const applyQAPreset = (preset: QAPersonaPreset) => {
    setRiasecAnswers(preset.riasec_answers);
    setCognitiveAnswers(preset.cognitive_answers);
    assessmentService.saveLocalDraft(preset.riasec_answers, preset.cognitive_answers, userId);
  };

  const submitAssessment = async (): Promise<AssessmentSubmissionResult> => {
    setIsSubmitting(true);
    try {
      const result = await assessmentService.submitAssessmentV1_8({
        riasec_answers: riasecAnswers,
        cognitive_answers: cognitiveAnswers,
        completion_time_seconds: 360,
      });

      setCalculatedVector(result.riasec_vector);
      setDominantTraits(result.dominant_traits);
      setIsCompleted(true);

      setScopedItem('calculated_vector', JSON.stringify(result.riasec_vector), userId);
      setScopedItem('dominant_traits', JSON.stringify(result.dominant_traits), userId);
      setScopedItem('assessment_completed', 'true', userId);
      setXpPoints((prev) => prev + 200);

      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setRiasecAnswers({});
    setCognitiveAnswers({});
    setCalculatedVector(null);
    setDominantTraits([]);
    setIsCompleted(false);
    setXpPoints(0);
    assessmentService.clearDraft(userId);
    removeScopedItem('calculated_vector', userId);
    removeScopedItem('dominant_traits', userId);
    removeScopedItem('assessment_completed', userId);
  };

  return (
    <AssessmentContext.Provider
      value={{
        riasecAnswers,
        cognitiveAnswers,
        setRiasecAnswer,
        setCognitiveAnswer,
        applyQAPreset,
        xpPoints,
        streakDays,
        calculatedVector,
        dominantTraits,
        submitAssessment,
        isSubmitting,
        isCompleted,
        resetAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
