import { eq, and, ilike, or, asc, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  accounts,
  profiles,
  courses,
  achievements,
  teams,
  achievementUsers,
  courseUsers,
  teamUsers,
  leads,
  courseModules,
  courseQuizzes,
  quizQuestions,
  quizAttempts,
  certificateRequests,
  studioCourses,
  studioModules,
  studioQuizzes,
  studentProfiles,
  generatedContent,
  studioEnrollments,
  studioModuleProgress,
  studioQuizAttempts,
  chatSessions,
  supportThreads,
  supportMessages,
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type Profile,
  type InsertProfile,
  type Course,
  type InsertCourse,
  type Achievement,
  type InsertAchievement,
  type Team,
  type InsertTeam,
  type AchievementUser,
  type InsertAchievementUser,
  type CourseUser,
  type InsertCourseUser,
  type TeamUser,
  type InsertTeamUser,
  type Lead,
  type InsertLead,
  type CourseModule,
  type InsertCourseModule,
  type CourseQuiz,
  type InsertCourseQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type CertificateRequest,
  type InsertCertificateRequest,
  type StudioCourse,
  type InsertStudioCourse,
  type StudioModule,
  type InsertStudioModule,
  type StudioQuiz,
  type InsertStudioQuiz,
  type StudentProfile,
  type InsertStudentProfile,
  type GeneratedContent,
  type InsertGeneratedContent,
  type StudioEnrollment,
  type InsertStudioEnrollment,
  type StudioModuleProgress,
  type InsertStudioModuleProgress,
  type StudioQuizAttempt,
  type InsertStudioQuizAttempt,
  type ChatSession,
  type SupportThread,
  type InsertSupportThread,
  type SupportMessage,
  type InsertSupportMessage,
  userContactCards,
  type UserContactCard,
  type InsertUserContactCard,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  getAccount(userId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(userId: string, data: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(userId: string): Promise<boolean>;

  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(userId: string): Promise<boolean>;

  getCourse(id: string): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  listCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<boolean>;

  getAchievement(id: string): Promise<Achievement | undefined>;
  listAchievements(): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, data: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: string): Promise<boolean>;

  getTeam(id: string): Promise<Team | undefined>;
  listTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  getUserAchievements(userId: string): Promise<AchievementUser[]>;
  awardAchievement(data: InsertAchievementUser): Promise<AchievementUser>;
  revokeAchievement(userId: string, achievementId: string): Promise<boolean>;

  getUserCourses(userId: string): Promise<CourseUser[]>;
  enrollCourse(data: InsertCourseUser): Promise<CourseUser>;
  updateCourseProgress(userId: string, courseId: string, completed: number): Promise<CourseUser | undefined>;
  updateListeningProgress(userId: string, courseId: string, listeningProgress: number): Promise<CourseUser | undefined>;
  unenrollCourse(userId: string, courseId: string): Promise<boolean>;

  getTeamMembers(teamId: string): Promise<TeamUser[]>;
  addTeamMember(data: InsertTeamUser): Promise<TeamUser>;
  removeTeamMember(teamId: string, userId: string): Promise<boolean>;

  createLead(lead: InsertLead): Promise<Lead>;

  getCourseModules(courseId: string): Promise<CourseModule[]>;
  getCourseModule(moduleId: string): Promise<CourseModule | undefined>;
  createCourseModule(data: InsertCourseModule): Promise<CourseModule>;

  getQuizByCourse(courseId: string): Promise<CourseQuiz | undefined>;
  getQuizByAcademyCourse(academyCourseId: number): Promise<CourseQuiz | undefined>;
  getQuiz(quizId: string): Promise<CourseQuiz | undefined>;
  createQuiz(data: InsertCourseQuiz): Promise<CourseQuiz>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  createQuizQuestion(data: InsertQuizQuestion): Promise<QuizQuestion>;
  createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]>;
  getAllUserQuizAttempts(userId: string): Promise<QuizAttempt[]>;

  getAchievementBySlug(slug: string): Promise<Achievement | undefined>;

  getUserTeams(userId: string): Promise<{ team: Team; role: string }[]>;

  createCertificateRequest(data: InsertCertificateRequest): Promise<CertificateRequest>;
  getCertificateRequest(id: string): Promise<CertificateRequest | undefined>;
  getCertificateRequestsByUser(userId: string): Promise<CertificateRequest[]>;
  listCertificateRequests(statusFilter?: string[]): Promise<CertificateRequest[]>;
  updateCertificateRequest(id: string, data: Partial<InsertCertificateRequest>): Promise<CertificateRequest | undefined>;
  updateAchievementUser(id: string, data: Partial<InsertAchievementUser>): Promise<AchievementUser | undefined>;

  getStudioCourses(filters?: { category?: string; search?: string; page?: number; limit?: number }): Promise<{ courses: StudioCourse[]; total: number }>;
  getStudioCourse(slug: string): Promise<StudioCourse | undefined>;
  getStudioModules(courseId: string): Promise<StudioModule[]>;
  getStudioModuleBySlugAndIndex(slug: string, moduleIndex: number): Promise<{ module: StudioModule; course: StudioCourse } | undefined>;
  getStudioQuiz(courseId: string): Promise<StudioQuiz | undefined>;
  getStudentProfile(userId: string): Promise<StudentProfile | undefined>;
  upsertStudentProfile(userId: string, data: Partial<InsertStudentProfile>): Promise<StudentProfile>;
  getGeneratedContent(userId: string, courseSlug: string, moduleIndex: number): Promise<GeneratedContent | undefined>;
  saveGeneratedContent(data: InsertGeneratedContent): Promise<GeneratedContent>;
  deleteGeneratedContent(userId: string, courseSlug: string, moduleIndex: number): Promise<boolean>;
  updateGeneratedContent(id: string, data: Partial<InsertGeneratedContent>): Promise<GeneratedContent | undefined>;
  createStudioEnrollment(data: InsertStudioEnrollment): Promise<StudioEnrollment>;
  getStudioEnrollments(userId: string): Promise<StudioEnrollment[]>;
  getStudioEnrollment(userId: string, source: string, courseIdentifier: string): Promise<StudioEnrollment | undefined>;
  updateStudioEnrollment(id: string, data: Partial<InsertStudioEnrollment>): Promise<StudioEnrollment | undefined>;
  getModuleProgress(enrollmentId: string, moduleIdentifier: string): Promise<StudioModuleProgress | undefined>;
  getModuleProgressForEnrollment(enrollmentId: string): Promise<StudioModuleProgress[]>;
  upsertModuleProgress(enrollmentId: string, moduleIdentifier: string, data: Partial<InsertStudioModuleProgress>): Promise<StudioModuleProgress>;
  createStudioQuizAttempt(data: InsertStudioQuizAttempt): Promise<StudioQuizAttempt>;
  getStudioQuizAttempts(userId: string, courseIdentifier: string): Promise<StudioQuizAttempt[]>;
  deleteStudioEnrollment(userId: string, courseIdentifier: string): Promise<boolean>;
  resetStudioEnrollmentProgress(enrollmentId: string): Promise<boolean>;
  getChatSession(userId: string, courseSlug: string, moduleIndex: number): Promise<ChatSession | undefined>;
  upsertChatSession(userId: string, courseSlug: string, moduleIndex: number, messages: any[]): Promise<ChatSession>;

  createSupportThread(data: InsertSupportThread): Promise<SupportThread>;
  getSupportThread(id: string): Promise<SupportThread | undefined>;
  getSupportThreadsByUser(userId: string): Promise<SupportThread[]>;
  getAllSupportThreads(): Promise<(SupportThread & { userName?: string; userEmail?: string })[]>;
  updateSupportThread(id: string, data: Partial<InsertSupportThread>): Promise<SupportThread | undefined>;
  createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage>;
  getSupportMessages(threadId: string): Promise<SupportMessage[]>;

  getContactCardBySlug(slug: string): Promise<UserContactCard | undefined>;
  getContactCardByUserId(userId: string): Promise<UserContactCard | undefined>;
  createContactCard(data: InsertUserContactCard): Promise<UserContactCard>;
  updateContactCard(id: string, data: Partial<InsertUserContactCard>): Promise<UserContactCard | undefined>;
  deleteContactCard(id: string): Promise<boolean>;
  isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getAccount(userId: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, userId));
    return account;
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(data).returning();
    return account;
  }

  async updateAccount(userId: string, data: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db.update(accounts).set({ ...data, updatedAt: new Date() }).where(eq(accounts.id, userId)).returning();
    return account;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const result = await db.delete(accounts).where(eq(accounts.id, userId)).returning();
    return result.length > 0;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    return profile;
  }

  async createProfile(data: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db.update(profiles).set({ ...data, updatedAt: new Date() }).where(eq(profiles.id, userId)).returning();
    return profile;
  }

  async deleteProfile(userId: string): Promise<boolean> {
    const result = await db.delete(profiles).where(eq(profiles.id, userId)).returning();
    return result.length > 0;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async listCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  async updateCourse(id: string, data: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set({ ...data, updatedAt: new Date() }).where(eq(courses.id, id)).returning();
    return course;
  }

  async deleteCourse(id: string): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();
    return result.length > 0;
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async listAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }

  async createAchievement(data: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(data).returning();
    return achievement;
  }

  async updateAchievement(id: string, data: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [achievement] = await db.update(achievements).set({ ...data, updatedAt: new Date() }).where(eq(achievements.id, id)).returning();
    return achievement;
  }

  async deleteAchievement(id: string): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id)).returning();
    return result.length > 0;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async listTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async createTeam(data: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(data).returning();
    return team;
  }

  async updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db.update(teams).set({ ...data, updatedAt: new Date() }).where(eq(teams.id, id)).returning();
    return team;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  async getUserAchievements(userId: string): Promise<AchievementUser[]> {
    return db.select().from(achievementUsers).where(eq(achievementUsers.userId, userId));
  }

  async awardAchievement(data: InsertAchievementUser): Promise<AchievementUser> {
    const [record] = await db.insert(achievementUsers).values(data).returning();
    return record;
  }

  async revokeAchievement(userId: string, achievementId: string): Promise<boolean> {
    const result = await db
      .delete(achievementUsers)
      .where(and(eq(achievementUsers.userId, userId), eq(achievementUsers.achievementId, achievementId)))
      .returning();
    return result.length > 0;
  }

  async getUserCourses(userId: string): Promise<CourseUser[]> {
    return db.select().from(courseUsers).where(eq(courseUsers.userId, userId));
  }

  async enrollCourse(data: InsertCourseUser): Promise<CourseUser> {
    const [record] = await db.insert(courseUsers).values(data).returning();
    return record;
  }

  async updateCourseProgress(userId: string, courseId: string, completed: number): Promise<CourseUser | undefined> {
    const [record] = await db
      .update(courseUsers)
      // El progreso nunca debe retroceder: si otro dispositivo ya guardó un
      // porcentaje mayor, lo conservamos (GREATEST) en lugar de sobrescribirlo.
      .set({ completed: sql`GREATEST(${courseUsers.completed}, ${completed})`, updatedAt: new Date() })
      .where(and(eq(courseUsers.userId, userId), eq(courseUsers.courseId, courseId)))
      .returning();
    return record;
  }

  async updateListeningProgress(userId: string, courseId: string, listeningProgress: number): Promise<CourseUser | undefined> {
    const clamped = Math.max(0, Math.min(100, listeningProgress));
    const [record] = await db
      .update(courseUsers)
      .set({ listeningProgress: clamped, updatedAt: new Date() })
      .where(and(eq(courseUsers.userId, userId), eq(courseUsers.courseId, courseId)))
      .returning();
    return record;
  }

  async unenrollCourse(userId: string, courseId: string): Promise<boolean> {
    const result = await db
      .delete(courseUsers)
      .where(and(eq(courseUsers.userId, userId), eq(courseUsers.courseId, courseId)))
      .returning();
    return result.length > 0;
  }

  async getTeamMembers(teamId: string): Promise<TeamUser[]> {
    return db.select().from(teamUsers).where(eq(teamUsers.teamId, teamId));
  }

  async addTeamMember(data: InsertTeamUser): Promise<TeamUser> {
    const [record] = await db.insert(teamUsers).values(data).returning();
    return record;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(teamUsers)
      .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getUserTeams(userId: string): Promise<{ team: Team; role: string }[]> {
    const rows = await db
      .select({ team: teams, role: teamUsers.role })
      .from(teamUsers)
      .innerJoin(teams, eq(teamUsers.teamId, teams.id))
      .where(eq(teamUsers.userId, userId));
    return rows;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [record] = await db.insert(leads).values(lead).returning();
    return record;
  }

  async getCourseModules(courseId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
  }

  async getCourseModule(moduleId: string): Promise<CourseModule | undefined> {
    const [mod] = await db.select().from(courseModules).where(eq(courseModules.id, moduleId));
    return mod;
  }

  async createCourseModule(data: InsertCourseModule): Promise<CourseModule> {
    const [mod] = await db.insert(courseModules).values(data).returning();
    return mod;
  }

  async getQuizByCourse(courseId: string): Promise<CourseQuiz | undefined> {
    const [quiz] = await db.select().from(courseQuizzes).where(eq(courseQuizzes.courseId, courseId));
    return quiz;
  }

  async getQuizByAcademyCourse(academyCourseId: number): Promise<CourseQuiz | undefined> {
    const [quiz] = await db.select().from(courseQuizzes).where(eq(courseQuizzes.academyCourseId, academyCourseId));
    return quiz;
  }

  async getQuiz(quizId: string): Promise<CourseQuiz | undefined> {
    const [quiz] = await db.select().from(courseQuizzes).where(eq(courseQuizzes.id, quizId));
    return quiz;
  }

  async createQuiz(data: InsertCourseQuiz): Promise<CourseQuiz> {
    const [quiz] = await db.insert(courseQuizzes).values(data).returning();
    return quiz;
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  }

  async createQuizQuestion(data: InsertQuizQuestion): Promise<QuizQuestion> {
    const [q] = await db.insert(quizQuestions).values(data).returning();
    return q;
  }

  async createQuizAttempt(data: InsertQuizAttempt): Promise<QuizAttempt> {
    const [attempt] = await db.insert(quizAttempts).values(data).returning();
    return attempt;
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)));
  }

  async getAllUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  async getAchievementBySlug(slug: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.slug, slug));
    return achievement;
  }

  async createCertificateRequest(data: InsertCertificateRequest): Promise<CertificateRequest> {
    const [record] = await db.insert(certificateRequests).values(data).returning();
    return record;
  }

  async getCertificateRequest(id: string): Promise<CertificateRequest | undefined> {
    const [record] = await db.select().from(certificateRequests).where(eq(certificateRequests.id, id));
    return record;
  }

  async getCertificateRequestsByUser(userId: string): Promise<CertificateRequest[]> {
    return db.select().from(certificateRequests).where(eq(certificateRequests.userId, userId));
  }

  async listCertificateRequests(statusFilter?: string[]): Promise<CertificateRequest[]> {
    if (statusFilter && statusFilter.length > 0) {
      const { inArray } = await import("drizzle-orm");
      return db.select().from(certificateRequests).where(inArray(certificateRequests.status, statusFilter as any));
    }
    return db.select().from(certificateRequests);
  }

  async updateCertificateRequest(id: string, data: Partial<InsertCertificateRequest>): Promise<CertificateRequest | undefined> {
    const [record] = await db.update(certificateRequests).set({ ...data, updatedAt: new Date() }).where(eq(certificateRequests.id, id)).returning();
    return record;
  }

  async updateAchievementUser(id: string, data: Partial<InsertAchievementUser>): Promise<AchievementUser | undefined> {
    const [record] = await db.update(achievementUsers).set({ ...data, updatedAt: new Date() }).where(eq(achievementUsers.id, id)).returning();
    return record;
  }

  async getStudioCourses(filters?: { category?: string; search?: string; page?: number; limit?: number }): Promise<{ courses: StudioCourse[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const offset = (page - 1) * limit;
    const conditions: any[] = [];
    if (filters?.category) {
      conditions.push(eq(studioCourses.category, filters.category));
    }
    if (filters?.search) {
      conditions.push(or(
        ilike(studioCourses.title, `%${filters.search}%`),
        ilike(studioCourses.description, `%${filters.search}%`)
      ));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(studioCourses).where(whereClause);
    const rows = await db.select().from(studioCourses).where(whereClause).orderBy(asc(studioCourses.title)).limit(limit).offset(offset);
    return { courses: rows, total: Number(countResult.count) };
  }

  async getStudioCourse(slug: string): Promise<StudioCourse | undefined> {
    const [course] = await db.select().from(studioCourses).where(eq(studioCourses.slug, slug));
    return course;
  }

  async getStudioModules(courseId: string): Promise<StudioModule[]> {
    return db.select().from(studioModules).where(eq(studioModules.courseId, courseId)).orderBy(asc(studioModules.moduleIndex));
  }

  async getStudioModuleBySlugAndIndex(slug: string, moduleIndex: number): Promise<{ module: StudioModule; course: StudioCourse } | undefined> {
    const course = await this.getStudioCourse(slug);
    if (!course) return undefined;
    const [mod] = await db.select().from(studioModules).where(and(eq(studioModules.courseId, course.id), eq(studioModules.moduleIndex, moduleIndex)));
    if (!mod) return undefined;
    return { module: mod, course };
  }

  async getStudioQuiz(courseId: string): Promise<StudioQuiz | undefined> {
    const [quiz] = await db.select().from(studioQuizzes).where(eq(studioQuizzes.courseId, courseId));
    return quiz;
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile;
  }

  async upsertStudentProfile(userId: string, data: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const existing = await this.getStudentProfile(userId);
    if (existing) {
      const [updated] = await db.update(studentProfiles).set(data).where(eq(studentProfiles.userId, userId)).returning();
      return updated;
    }
    const [created] = await db.insert(studentProfiles).values({ ...data, userId }).returning();
    return created;
  }

  async getGeneratedContent(userId: string, courseSlug: string, moduleIndex: number): Promise<GeneratedContent | undefined> {
    const [content] = await db.select().from(generatedContent).where(and(
      eq(generatedContent.userId, userId),
      eq(generatedContent.courseSlug, courseSlug),
      eq(generatedContent.moduleIndex, moduleIndex)
    ));
    return content;
  }

  async saveGeneratedContent(data: InsertGeneratedContent): Promise<GeneratedContent> {
    const [content] = await db.insert(generatedContent).values(data)
      .onConflictDoUpdate({
        target: [generatedContent.userId, generatedContent.courseSlug, generatedContent.moduleIndex],
        set: {
          lectureHtml: data.lectureHtml,
          mindMap: data.mindMap,
          reflections: data.reflections,
          adaptiveQuiz: data.adaptiveQuiz,
          suggestedSources: data.suggestedSources,
          podcastScript: data.podcastScript,
          classScript: data.classScript,
          personalizedFor: data.personalizedFor,
          generationStatus: data.generationStatus,
          isStub: data.isStub,
          consecutiveFailures: data.consecutiveFailures,
          generatedAt: new Date(),
        },
      })
      .returning();
    return content;
  }

  async deleteGeneratedContent(userId: string, courseSlug: string, moduleIndex: number): Promise<boolean> {
    const result = await db.delete(generatedContent).where(and(
      eq(generatedContent.userId, userId),
      eq(generatedContent.courseSlug, courseSlug),
      eq(generatedContent.moduleIndex, moduleIndex)
    )).returning();
    return result.length > 0;
  }

  async updateGeneratedContent(id: string, data: Partial<InsertGeneratedContent>): Promise<GeneratedContent | undefined> {
    const [updated] = await db.update(generatedContent).set(data).where(eq(generatedContent.id, id)).returning();
    return updated;
  }

  async createStudioEnrollment(data: InsertStudioEnrollment): Promise<StudioEnrollment> {
    const [enrollment] = await db.insert(studioEnrollments).values(data)
      .onConflictDoNothing()
      .returning();
    if (!enrollment) {
      const existing = await this.getStudioEnrollment(data.userId, data.source || "studio", data.courseIdentifier);
      return existing!;
    }
    return enrollment;
  }

  async getStudioEnrollments(userId: string): Promise<StudioEnrollment[]> {
    return db.select().from(studioEnrollments).where(eq(studioEnrollments.userId, userId)).orderBy(desc(studioEnrollments.enrolledAt));
  }

  async getStudioEnrollment(userId: string, source: string, courseIdentifier: string): Promise<StudioEnrollment | undefined> {
    const [enrollment] = await db.select().from(studioEnrollments).where(and(
      eq(studioEnrollments.userId, userId),
      eq(studioEnrollments.source, source),
      eq(studioEnrollments.courseIdentifier, courseIdentifier)
    ));
    return enrollment;
  }

  async updateStudioEnrollment(id: string, data: Partial<InsertStudioEnrollment>): Promise<StudioEnrollment | undefined> {
    const [enrollment] = await db.update(studioEnrollments).set({ ...data, lastAccessedAt: new Date() }).where(eq(studioEnrollments.id, id)).returning();
    return enrollment;
  }

  async getModuleProgress(enrollmentId: string, moduleIdentifier: string): Promise<StudioModuleProgress | undefined> {
    const [progress] = await db.select().from(studioModuleProgress).where(and(
      eq(studioModuleProgress.enrollmentId, enrollmentId),
      eq(studioModuleProgress.moduleIdentifier, moduleIdentifier)
    ));
    return progress;
  }

  async getModuleProgressForEnrollment(enrollmentId: string): Promise<StudioModuleProgress[]> {
    return db.select().from(studioModuleProgress).where(eq(studioModuleProgress.enrollmentId, enrollmentId));
  }

  async upsertModuleProgress(enrollmentId: string, moduleIdentifier: string, data: Partial<InsertStudioModuleProgress>): Promise<StudioModuleProgress> {
    const existing = await this.getModuleProgress(enrollmentId, moduleIdentifier);
    if (existing) {
      const [updated] = await db.update(studioModuleProgress).set(data).where(eq(studioModuleProgress.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(studioModuleProgress).values({
      enrollmentId,
      moduleIdentifier,
      ...data,
    }).returning();
    return created;
  }

  // Append-only a propósito: solo insert. No hay update ni delete de intentos.
  async createStudioQuizAttempt(data: InsertStudioQuizAttempt): Promise<StudioQuizAttempt> {
    const [attempt] = await db.insert(studioQuizAttempts).values(data).returning();
    return attempt;
  }

  async getStudioQuizAttempts(userId: string, courseIdentifier: string): Promise<StudioQuizAttempt[]> {
    return db.select().from(studioQuizAttempts).where(and(
      eq(studioQuizAttempts.userId, userId),
      eq(studioQuizAttempts.courseIdentifier, courseIdentifier),
    )).orderBy(desc(studioQuizAttempts.createdAt));
  }

  async deleteStudioEnrollment(userId: string, courseIdentifier: string): Promise<boolean> {
    const result = await db
      .delete(studioEnrollments)
      .where(and(eq(studioEnrollments.userId, userId), eq(studioEnrollments.courseIdentifier, courseIdentifier)))
      .returning();
    return result.length > 0;
  }

  async resetStudioEnrollmentProgress(enrollmentId: string): Promise<boolean> {
    await db.delete(studioModuleProgress).where(eq(studioModuleProgress.enrollmentId, enrollmentId));
    await db.update(studioEnrollments).set({ progressPercent: 0 }).where(eq(studioEnrollments.id, enrollmentId));
    return true;
  }

  async getChatSession(userId: string, courseSlug: string, moduleIndex: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(and(
      eq(chatSessions.userId, userId),
      eq(chatSessions.courseSlug, courseSlug),
      eq(chatSessions.moduleIndex, moduleIndex)
    ));
    return session;
  }

  async upsertChatSession(userId: string, courseSlug: string, moduleIndex: number, messages: any[]): Promise<ChatSession> {
    const existing = await this.getChatSession(userId, courseSlug, moduleIndex);
    if (existing) {
      const [updated] = await db.update(chatSessions).set({ messages, updatedAt: new Date() }).where(eq(chatSessions.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(chatSessions).values({ userId, courseSlug, moduleIndex, messages }).returning();
    return created;
  }

  async createSupportThread(data: InsertSupportThread): Promise<SupportThread> {
    const [thread] = await db.insert(supportThreads).values(data).returning();
    return thread;
  }

  async getSupportThread(id: string): Promise<SupportThread | undefined> {
    const [thread] = await db.select().from(supportThreads).where(eq(supportThreads.id, id));
    return thread;
  }

  async getSupportThreadsByUser(userId: string): Promise<SupportThread[]> {
    return db.select().from(supportThreads).where(eq(supportThreads.userId, userId)).orderBy(desc(supportThreads.createdAt));
  }

  async getAllSupportThreads(): Promise<(SupportThread & { userName?: string; userEmail?: string })[]> {
    const rows = await db
      .select({
        id: supportThreads.id,
        userId: supportThreads.userId,
        subject: supportThreads.subject,
        academyCourseId: supportThreads.academyCourseId,
        status: supportThreads.status,
        createdAt: supportThreads.createdAt,
        updatedAt: supportThreads.updatedAt,
        userEmail: users.email,
      })
      .from(supportThreads)
      .leftJoin(users, eq(supportThreads.userId, users.id))
      .orderBy(desc(supportThreads.createdAt));
    return rows.map(r => ({ ...r, userEmail: r.userEmail ?? undefined }));
  }

  async updateSupportThread(id: string, data: Partial<InsertSupportThread>): Promise<SupportThread | undefined> {
    const [thread] = await db.update(supportThreads).set({ ...data, updatedAt: new Date() }).where(eq(supportThreads.id, id)).returning();
    return thread;
  }

  async createSupportMessage(data: InsertSupportMessage): Promise<SupportMessage> {
    const [msg] = await db.insert(supportMessages).values(data).returning();
    await db.update(supportThreads).set({ updatedAt: new Date() }).where(eq(supportThreads.id, data.threadId));
    return msg;
  }

  async getSupportMessages(threadId: string): Promise<SupportMessage[]> {
    return db.select().from(supportMessages).where(eq(supportMessages.threadId, threadId)).orderBy(asc(supportMessages.createdAt));
  }

  async getContactCardBySlug(slug: string): Promise<UserContactCard | undefined> {
    const [card] = await db.select().from(userContactCards).where(eq(userContactCards.slug, slug));
    return card;
  }

  async getContactCardByUserId(userId: string): Promise<UserContactCard | undefined> {
    const [card] = await db.select().from(userContactCards).where(eq(userContactCards.userId, userId));
    return card;
  }

  async createContactCard(data: InsertUserContactCard): Promise<UserContactCard> {
    const [card] = await db.insert(userContactCards).values(data).returning();
    return card;
  }

  async updateContactCard(id: string, data: Partial<InsertUserContactCard>): Promise<UserContactCard | undefined> {
    const [card] = await db.update(userContactCards).set({ ...data, updatedAt: new Date() }).where(eq(userContactCards.id, id)).returning();
    return card;
  }

  async deleteContactCard(id: string): Promise<boolean> {
    const result = await db.delete(userContactCards).where(eq(userContactCards.id, id)).returning();
    return result.length > 0;
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    if (excludeId) {
      const results = await db.select().from(userContactCards).where(and(eq(userContactCards.slug, slug), sql`${userContactCards.id} != ${excludeId}`));
      return results.length === 0;
    }
    const results = await db.select().from(userContactCards).where(eq(userContactCards.slug, slug));
    return results.length === 0;
  }
}

export const storage = new DatabaseStorage();
