import { z } from 'zod';
import { equipmentSchema, muscleGroupSchema, planStatusSchema, workoutStatusSchema } from './enums.js';

/** Exercicio no catalogo. Curado por nos - a IA seleciona, nao inventa. */
export const exerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  canonicalName: z.string().regex(/^[a-z0-9_]+$/).max(60),
  primaryMuscle: muscleGroupSchema,
  secondaryMuscles: z.array(muscleGroupSchema).max(4).default([]),
  requiredEquipment: z.array(equipmentSchema).min(1).max(4),
  /** Instrucoes de execucao, passo a passo. */
  instructions: z.array(z.string().trim().min(5).max(300)).max(8).default([]),
  /** Erros comuns. Exibidos na tela de execucao. */
  commonMistakes: z.array(z.string().trim().min(5).max(200)).max(5).default([]),
  isCompound: z.boolean(),
  difficultyLevel: z.number().int().min(1).max(3),
  demoVideoUrl: z.string().url().nullish(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

/** Prescricao de um exercicio dentro de um treino. */
export const workoutExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  exercise: exerciseSchema.optional(),
  order: z.number().int().min(0).max(30),
  sets: z.number().int().min(1).max(10),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(600),
  /** Carga sugerida em kg. Nula na primeira execucao - o usuario define. */
  suggestedLoadKg: z.number().min(0).max(500).nullish(),
  notes: z.string().trim().max(200).nullish(),
});
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

/** Uma sessao de treino ("Treino A - Peito e Triceps"). */
export const workoutSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  /** Posicao no ciclo semanal (0 = primeiro treino da semana). */
  dayIndex: z.number().int().min(0).max(6),
  focusMuscles: z.array(muscleGroupSchema).min(1).max(5),
  estimatedDurationMinutes: z.number().int().min(10).max(180),
  status: workoutStatusSchema.default('scheduled'),
  exercises: z.array(workoutExerciseSchema).min(1).max(15),
});
export type Workout = z.infer<typeof workoutSchema>;

export const workoutPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  daysPerWeek: z.number().int().min(1).max(7),
  /** Divisao usada: full body, upper/lower, push/pull/legs... */
  split: z.string().trim().max(40),
  status: planStatusSchema,
  startsOn: z.string().date(),
  workouts: z.array(workoutSchema).min(1).max(7),
  disclaimer: z.string(),
});
export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

/**
 * O que o modelo retorna ao gerar um plano de treino.
 *
 * Referencia exercicios por `canonicalName` do nosso catalogo - nunca texto
 * livre. Se o modelo citar algo que nao existe, a validacao rejeita e nos
 * regeneramos com a lista de nomes validos no prompt. Isso impede "supino
 * declinado com halter neutro na maquina Smith" virar um exercicio orfao sem
 * instrucoes, video ou grupo muscular.
 */
export const workoutPlanModelOutputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  split: z.string().trim().max(40),
  rationale: z.string().trim().max(500),
  workouts: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(80),
        dayIndex: z.number().int().min(0).max(6),
        focusMuscles: z.array(muscleGroupSchema).min(1).max(5),
        exercises: z
          .array(
            z.object({
              canonicalName: z.string().regex(/^[a-z0-9_]+$/).max(60),
              sets: z.number().int().min(1).max(10),
              repsMin: z.number().int().min(1).max(100),
              repsMax: z.number().int().min(1).max(100),
              restSeconds: z.number().int().min(0).max(600),
              notes: z.string().trim().max(200).nullish(),
            }),
          )
          .min(2)
          .max(12),
      }),
    )
    .min(1)
    .max(7),
});
export type WorkoutPlanModelOutput = z.infer<typeof workoutPlanModelOutputSchema>;

/** Uma serie executada. */
export const setLogSchema = z.object({
  setNumber: z.number().int().min(1).max(20),
  reps: z.number().int().min(0).max(200),
  loadKg: z.number().min(0).max(500).default(0),
  /** Repeticoes em reserva (RIR). Base da progressao automatica. */
  rir: z.number().int().min(0).max(10).nullish(),
  isWarmup: z.boolean().default(false),
});
export type SetLog = z.infer<typeof setLogSchema>;

export const logExerciseSchema = z.object({
  workoutLogId: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
  sets: z.array(setLogSchema).min(1).max(20),
  notes: z.string().trim().max(200).nullish(),
});
export type LogExerciseInput = z.infer<typeof logExerciseSchema>;

export const completeWorkoutSchema = z.object({
  durationSeconds: z.number().int().min(0).max(36000),
  perceivedEffort: z.number().int().min(1).max(10).nullish(),
  notes: z.string().trim().max(500).nullish(),
});
export type CompleteWorkoutInput = z.infer<typeof completeWorkoutSchema>;
