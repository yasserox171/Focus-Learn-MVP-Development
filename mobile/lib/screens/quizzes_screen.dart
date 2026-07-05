import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state.dart';
import 'quiz_screen.dart';

class QuizzesScreen extends StatefulWidget {
  const QuizzesScreen({super.key});

  @override
  State<QuizzesScreen> createState() => _QuizzesScreenState();
}

class _QuizzesScreenState extends State<QuizzesScreen> {
  List<QuizSummary>? _quizzes;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AppState>().api;
    setState(() {
      _quizzes = null;
      _failed = false;
    });
    try {
      final quizzes = await api.quizzes();
      if (mounted) setState(() => _quizzes = quizzes);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    if (_failed) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(app.t('error')),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: _load, child: Text(app.t('retry'))),
          ],
        ),
      );
    }
    if (_quizzes == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_quizzes!.isEmpty) {
      return Center(child: Text(app.t('noQuizzes')));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          for (final quiz in _quizzes!)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                title: Directionality(
                  textDirection: quiz.language == 'ar'
                      ? TextDirection.rtl
                      : TextDirection.ltr,
                  child: Text(quiz.title),
                ),
                subtitle: Text(
                  '${quiz.level.name(app.uiLang)} · '
                  '${app.t(quiz.quizType == 'entrance_exam' ? 'typeEntranceExam' : 'typeLesson')} · '
                  '${quiz.questionsCount} ${app.t('questions')}',
                ),
                trailing: const Icon(Icons.play_arrow),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => QuizScreen(quizId: quiz.id)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
