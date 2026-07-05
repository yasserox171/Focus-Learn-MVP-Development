// Integration test for ApiClient against a live backend.
//
// Skipped automatically unless the backend is reachable. Run the Django
// server (python manage.py runserver) and: flutter test test/api_client_live_test.dart

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:focus_learn/api/client.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<bool> _backendUp(String host, int port) async {
  try {
    final socket = await Socket.connect(host, port,
        timeout: const Duration(seconds: 2));
    socket.destroy();
    return true;
  } catch (_) {
    return false;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('full student flow against live API', () async {
    // Allow real network access inside flutter test
    HttpOverrides.global = null;
    if (!await _backendUp('127.0.0.1', 8000)) {
      markTestSkipped('backend not running on 127.0.0.1:8000');
      return;
    }

    SharedPreferences.setMockInitialValues({});
    final api = ApiClient();
    await api.init();
    await api.setServer('http://127.0.0.1:8000');

    // Reference data
    final subjects = await api.subjects();
    final levels = await api.levels();
    expect(subjects, isNotEmpty);
    expect(levels, isNotEmpty);

    // Public lesson browsing + filters
    final lessons = await api.lessons(language: 'ar');
    expect(lessons, isNotEmpty);
    final lesson = await api.lesson(lessons.first.id);
    expect(lesson.blocks, isNotEmpty);
    expect(lesson.blocks.any((b) => b.type == 'latex'), isTrue);

    // Login
    final user = await api.login('student1', 'testpass123');
    expect(user.role, 'student');
    expect(api.isLoggedIn, isTrue);

    // Quiz without answer leakage, then graded submit
    final quizzes = await api.quizzes(language: 'ar');
    expect(quizzes, isNotEmpty);
    final quiz = await api.quiz(quizzes.first.id);
    expect(quiz.questions, isNotEmpty);
    expect(quiz.questions.first.choices.length, greaterThanOrEqualTo(2));

    final answers = {
      for (final q in quiz.questions) q.id: q.choices.first.id,
    };
    final result = await api.submitQuiz(quiz.id, answers);
    expect(result.totalQuestions, quiz.questions.length);
    expect(result.correction.length, quiz.questions.length);
    expect(result.score, inInclusiveRange(0, result.totalQuestions));

    // Progress + attempts
    final progress = await api.progress();
    expect(progress.attemptsCount, greaterThan(0));
    final attempts = await api.attempts();
    expect(attempts, isNotEmpty);
    expect(attempts.first.quizTitle, isNotEmpty);

    // Mark lesson completed
    await api.markLessonCompleted(lesson.id);
  });
}
