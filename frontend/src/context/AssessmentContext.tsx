import React, { createContext, useContext, useState, useEffect } from 'react';
import { RIASECVector, QAPersonaPreset, AssessmentSubmissionResult } from '../types';
import { assessmentService } from '../services/careerServices';

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
  const [riasecAnswers, setRiasecAnswers] = useState<Record<string, number>>(() => {
    const draft = assessmentService.getLocalDraft();
    return (draft?.answers as Record<string, number>) || {};
  });

  const [cognitiveAnswers, setCognitiveAnswers] = useState<Record<string, string>>(() => {
    const draft = assessmentService.getLocalDraft();
    return draft?.preferences || {};
  });

  const [calculatedVector, setCalculatedVector] = useState<RIASECVector | null>(() => {
    const saved = localStorage.getItem('careerguide_calculated_vector');
    return saved ? JSON.parse(saved) : null;
  });

  const [dominantTraits, setDominantTraits] = useState<string[]>(() => {
    const saved = localStorage.getItem('careerguide_dominant_traits');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    return localStorage.getItem('careerguide_assessment_completed') === 'true';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [streakDays] = useState<number>(1);

  // Dynamic XP: +25 XP per answered question (up to 38 items = 950 XP) + 200 completion bonus = 1150 XP
  const answeredCount = Object.keys(riasecAnswers).length + Object.keys(cognitiveAnswers).length;
  const [xpPoints, setXpPoints] = useState<number>(() => {
    return answeredCount * 25 + (isCompleted ? 200 : 0);
  });

  // Auto-save draft on answers change
  useEffect(() => {
    if (answeredCount > 0) {
      assessmentService.saveLocalDraft(riasecAnswers, cognitiveAnswers);
    }
    setXpPoints(answeredCount * 25 + (isCompleted ? 200 : 0));
  }, [riasecAnswers, cognitiveAnswers, answeredCount, isCompleted]);

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
    assessmentService.saveLocalDraft(preset.riasec_answers, preset.cognitive_answers);
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

      localStorage.setItem('careerguide_calculated_vector', JSON.stringify(result.riasec_vector));
      localStorage.setItem('careerguide_dominant_traits', JSON.stringify(result.dominant_traits));
      localStorage.setItem('careerguide_assessment_completed', 'true');
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
    assessmentService.clearDraft();
    localStorage.removeItem('careerguide_calculated_vector');
    localStorage.removeItem('careerguide_dominant_traits');
    localStorage.removeItem('careerguide_assessment_completed');
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
