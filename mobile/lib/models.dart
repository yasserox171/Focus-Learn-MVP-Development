/// Data models mirroring the Focus Learn API and the agreed
/// `content.blocks` JSON structure (same one the React frontend reads).
library;

class User {
  final int id;
  final String username;
  final String role;
  final String preferredUiLanguage;

  User({
    required this.id,
    required this.username,
    required this.role,
    required this.preferredUiLanguage,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        username: json['username'] as String,
        role: json['role'] as String,
        preferredUiLanguage: (json['preferred_ui_language'] as String?) ?? 'ar',
      );
}

class Subject {
  final int id;
  final String nameAr;
  final String nameFr;
  final String slug;

  Subject({
    required this.id,
    required this.nameAr,
    required this.nameFr,
    required this.slug,
  });

  factory Subject.fromJson(Map<String, dynamic> json) => Subject(
        id: json['id'] as int,
        nameAr: json['name_ar'] as String,
        nameFr: json['name_fr'] as String,
        slug: json['slug'] as String,
      );

  String name(String uiLang) => uiLang == 'ar' ? nameAr : nameFr;
}

class Level {
  final int id;
  final String nameAr;
  final String nameFr;
  final String slug;

  Level({
    required this.id,
    required this.nameAr,
    required this.nameFr,
    required this.slug,
  });

  factory Level.fromJson(Map<String, dynamic> json) => Level(
        id: json['id'] as int,
        nameAr: json['name_ar'] as String,
        nameFr: json['name_fr'] as String,
        slug: json['slug'] as String,
      );

  String name(String uiLang) => uiLang == 'ar' ? nameAr : nameFr;
}

class ContentBlock {
  final String type;
  final String? text;
  final String? url;
  final String? caption;

  ContentBlock({required this.type, this.text, this.url, this.caption});

  factory ContentBlock.fromJson(Map<String, dynamic> json) => ContentBlock(
        type: json['type'] as String? ?? '',
        text: json['text'] as String?,
        url: json['url'] as String?,
        caption: json['caption'] as String?,
      );
}

class LessonSummary {
  final int id;
  final String title;
  final String language;
  final Subject subject;
  final Level level;
  final List<String> tags;

  LessonSummary({
    required this.id,
    required this.title,
    required this.language,
    required this.subject,
    required this.level,
    required this.tags,
  });

  factory LessonSummary.fromJson(Map<String, dynamic> json) => LessonSummary(
        id: json['id'] as int,
        title: json['title'] as String,
        language: json['language'] as String,
        subject: Subject.fromJson(json['subject'] as Map<String, dynamic>),
        level: Level.fromJson(json['level'] as Map<String, dynamic>),
        tags: ((json['tags'] as List?) ?? []).cast<String>(),
      );
}

class Lesson extends LessonSummary {
  final List<ContentBlock> blocks;
  final String? videoUrl;
  final String authorUsername;

  Lesson({
    required super.id,
    required super.title,
    required super.language,
    required super.subject,
    required super.level,
    required super.tags,
    required this.blocks,
    required this.videoUrl,
    required this.authorUsername,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    final content = (json['content'] as Map<String, dynamic>?) ?? {};
    final rawBlocks = (content['blocks'] as List?) ?? [];
    return Lesson(
      id: json['id'] as int,
      title: json['title'] as String,
      language: json['language'] as String,
      subject: Subject.fromJson(json['subject'] as Map<String, dynamic>),
      level: Level.fromJson(json['level'] as Map<String, dynamic>),
      tags: ((json['tags'] as List?) ?? []).cast<String>(),
      blocks: rawBlocks
          .map((b) => ContentBlock.fromJson(b as Map<String, dynamic>))
          .toList(),
      videoUrl: json['video_url'] as String?,
      authorUsername: (json['author_username'] as String?) ?? '',
    );
  }
}

class Choice {
  final int id;
  final String text;

  Choice({required this.id, required this.text});

  factory Choice.fromJson(Map<String, dynamic> json) =>
      Choice(id: json['id'] as int, text: json['text'] as String);
}

class Question {
  final int id;
  final String text;
  final List<Choice> choices;

  Question({required this.id, required this.text, required this.choices});

  factory Question.fromJson(Map<String, dynamic> json) => Question(
        id: json['id'] as int,
        text: json['text'] as String,
        choices: ((json['choices'] as List?) ?? [])
            .map((c) => Choice.fromJson(c as Map<String, dynamic>))
            .toList(),
      );
}

class QuizSummary {
  final int id;
  final String title;
  final String language;
  final String quizType;
  final Level level;
  final int questionsCount;
  final String? lessonTitle;

  QuizSummary({
    required this.id,
    required this.title,
    required this.language,
    required this.quizType,
    required this.level,
    required this.questionsCount,
    this.lessonTitle,
  });

  factory QuizSummary.fromJson(Map<String, dynamic> json) => QuizSummary(
        id: json['id'] as int,
        title: json['title'] as String,
        language: json['language'] as String,
        quizType: (json['quiz_type'] as String?) ?? 'lesson',
        level: Level.fromJson(json['level'] as Map<String, dynamic>),
        questionsCount: (json['questions_count'] as int?) ?? 0,
        lessonTitle: json['lesson_title'] as String?,
      );
}

class Quiz extends QuizSummary {
  final List<Question> questions;

  Quiz({
    required super.id,
    required super.title,
    required super.language,
    required super.quizType,
    required super.level,
    required super.questionsCount,
    super.lessonTitle,
    required this.questions,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) => Quiz(
        id: json['id'] as int,
        title: json['title'] as String,
        language: json['language'] as String,
        quizType: (json['quiz_type'] as String?) ?? 'lesson',
        level: Level.fromJson(json['level'] as Map<String, dynamic>),
        questionsCount: (json['questions_count'] as int?) ?? 0,
        lessonTitle: json['lesson_title'] as String?,
        questions: ((json['questions'] as List?) ?? [])
            .map((q) => Question.fromJson(q as Map<String, dynamic>))
            .toList(),
      );
}

class CorrectionEntry {
  final int questionId;
  final int? chosenChoiceId;
  final int? correctChoiceId;
  final bool isCorrect;

  CorrectionEntry({
    required this.questionId,
    required this.chosenChoiceId,
    required this.correctChoiceId,
    required this.isCorrect,
  });

  factory CorrectionEntry.fromJson(Map<String, dynamic> json) =>
      CorrectionEntry(
        questionId: json['question_id'] as int,
        chosenChoiceId: json['chosen_choice_id'] as int?,
        correctChoiceId: json['correct_choice_id'] as int?,
        isCorrect: json['is_correct'] as bool,
      );
}

class SubmitResult {
  final double score;
  final int totalQuestions;
  final List<CorrectionEntry> correction;

  SubmitResult({
    required this.score,
    required this.totalQuestions,
    required this.correction,
  });

  factory SubmitResult.fromJson(Map<String, dynamic> json) => SubmitResult(
        score: (json['score'] as num).toDouble(),
        totalQuestions: json['total_questions'] as int,
        correction: ((json['correction'] as List?) ?? [])
            .map((c) => CorrectionEntry.fromJson(c as Map<String, dynamic>))
            .toList(),
      );
}

class Attempt {
  final int id;
  final String quizTitle;
  final double score;
  final int totalQuestions;
  final DateTime completedAt;

  Attempt({
    required this.id,
    required this.quizTitle,
    required this.score,
    required this.totalQuestions,
    required this.completedAt,
  });

  factory Attempt.fromJson(Map<String, dynamic> json) => Attempt(
        id: json['id'] as int,
        quizTitle: (json['quiz_title'] as String?) ?? '',
        score: (json['score'] as num).toDouble(),
        totalQuestions: json['total_questions'] as int,
        completedAt: DateTime.parse(json['completed_at'] as String),
      );
}

class Progress {
  final int completedLessons;
  final int viewedLessons;
  final int attemptsCount;
  final double? averageScorePct;
  final DateTime? lastActivity;

  Progress({
    required this.completedLessons,
    required this.viewedLessons,
    required this.attemptsCount,
    required this.averageScorePct,
    required this.lastActivity,
  });

  factory Progress.fromJson(Map<String, dynamic> json) => Progress(
        completedLessons: (json['completed_lessons'] as int?) ?? 0,
        viewedLessons: (json['viewed_lessons'] as int?) ?? 0,
        attemptsCount: (json['attempts_count'] as int?) ?? 0,
        averageScorePct: (json['average_score_pct'] as num?)?.toDouble(),
        lastActivity: json['last_activity'] == null
            ? null
            : DateTime.parse(json['last_activity'] as String),
      );
}
