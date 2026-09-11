import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildEnergyPlan,
  yearsSince,
  type ActivityLevel,
  type DietaryRestriction,
  type EnergyPlan,
  type Equipment,
  type Goal,
  type GoalPace,
  type Sex,
  type TrainingExperience,
  type TrainingLocation,
} from '@nutrisnap/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Rascunho preenchido passo a passo no onboarding (ver docs/02-mvp.md, item 2).
 * Campos opcionais de proposito: cada passo so preenche os seus, e o usuario
 * pode fechar o app no meio e retomar de onde parou.
 */
export interface OnboardingDraft {
  displayName?: string;
  sex?: Sex;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  bodyFatPercentage?: number | null;
  goal?: Goal;
  pace?: GoalPace;
  targetWeightKg?: number | null;
  activityLevel?: ActivityLevel;
  trainingDaysPerWeek?: number;
  restrictions?: DietaryRestriction[];
  experience?: TrainingExperience;
  location?: TrainingLocation;
  availableEquipment?: Equipment[];
}

export type Profile = Required<
  Pick<
    OnboardingDraft,
    | 'displayName'
    | 'sex'
    | 'birthDate'
    | 'heightCm'
    | 'weightKg'
    | 'goal'
    | 'pace'
    | 'activityLevel'
    | 'trainingDaysPerWeek'
    | 'experience'
    | 'location'
    | 'availableEquipment'
    | 'restrictions'
  >
> & {
  bodyFatPercentage?: number | null;
  targetWeightKg?: number | null;
};

interface ProfileState {
  draft: OnboardingDraft;
  profile: Profile | null;
  energyPlan: EnergyPlan | null;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

function computeEnergyPlan(profile: Profile): EnergyPlan {
  return buildEnergyPlan({
    sex: profile.sex,
    ageYears: yearsSince(new Date(profile.birthDate)),
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bodyFatPercentage: profile.bodyFatPercentage,
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    pace: profile.pace,
  });
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      draft: {},
      profile: null,
      energyPlan: null,

      updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

      completeOnboarding: () => {
        const { draft } = get();
        if (
          !draft.displayName ||
          !draft.sex ||
          !draft.birthDate ||
          !draft.heightCm ||
          !draft.weightKg ||
          !draft.goal ||
          !draft.activityLevel ||
          draft.trainingDaysPerWeek === undefined ||
          !draft.experience ||
          !draft.location ||
          !draft.availableEquipment
        ) {
          throw new Error('Onboarding incompleto: faltam campos obrigatorios.');
        }

        const profile: Profile = {
          displayName: draft.displayName,
          sex: draft.sex,
          birthDate: draft.birthDate,
          heightCm: draft.heightCm,
          weightKg: draft.weightKg,
          bodyFatPercentage: draft.bodyFatPercentage ?? null,
          goal: draft.goal,
          pace: draft.pace ?? 'moderate',
          targetWeightKg: draft.targetWeightKg ?? null,
          activityLevel: draft.activityLevel,
          trainingDaysPerWeek: draft.trainingDaysPerWeek,
          experience: draft.experience,
          location: draft.location,
          availableEquipment: draft.availableEquipment,
          restrictions: draft.restrictions ?? [],
        };

        set({ profile, energyPlan: computeEnergyPlan(profile) });
      },

      resetProfile: () => set({ draft: {}, profile: null, energyPlan: null }),
    }),
    {
      name: 'nutrisnap.profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
