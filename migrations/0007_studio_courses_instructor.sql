-- Migration: Add instructor column to studio_courses
-- Tutor IA (Studio) per-course voice personalization: the TTS voice used to
-- narrate a course's personalized audio must match the course's instructor.

ALTER TABLE "studio_courses" ADD COLUMN "instructor" text;
