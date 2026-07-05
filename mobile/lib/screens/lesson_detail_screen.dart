import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state.dart';
import '../widgets/block_renderer.dart';
import 'quiz_screen.dart';

class LessonDetailScreen extends StatefulWidget {
  final int lessonId;

  const LessonDetailScreen({super.key, required this.lessonId});

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> {
  Lesson? _lesson;
  List<QuizSummary> _quizzes = [];
  bool _failed = false;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AppState>().api;
    setState(() => _failed = false);
    try {
      final lesson = await api.lesson(widget.lessonId);
      final quizzes = await api.quizzes(lessonId: widget.lessonId);
      if (mounted) {
        setState(() {
          _lesson = lesson;
          _quizzes = quizzes;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _markCompleted() async {
    final app = context.read<AppState>();
    try {
      await app.api.markLessonCompleted(widget.lessonId);
      if (mounted) setState(() => _completed = true);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final lesson = _lesson;
    return Scaffold(
      appBar: AppBar(title: Text(lesson?.title ?? '')),
      body: _failed
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(app.t('error')),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _load, child: Text(app.t('retry'))),
                ],
              ),
            )
          : lesson == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // The lesson body follows its own content language,
                    // independent from the app's UI language.
                    Directionality(
                      textDirection: lesson.language == 'ar'
                          ? TextDirection.rtl
                          : TextDirection.ltr,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            lesson.title,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          BlockRenderer(blocks: lesson.blocks),
                          if (lesson.videoUrl != null &&
                              lesson.videoUrl!.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            VideoLinkCard(
                              url: lesson.videoUrl!,
                              label: app.t('openVideo'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (app.user != null)
                      FilledButton.icon(
                        onPressed: _completed ? null : _markCompleted,
                        icon: Icon(_completed
                            ? Icons.check_circle
                            : Icons.check_circle_outline),
                        label: Text(app.t(
                            _completed ? 'completed' : 'markCompleted')),
                      ),
                    if (_quizzes.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        app.t('relatedQuizzes'),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      for (final quiz in _quizzes)
                        Card(
                          child: ListTile(
                            title: Text(quiz.title),
                            subtitle: Text(
                                '${quiz.questionsCount} ${app.t('questions')}'),
                            trailing: const Icon(Icons.chevron_left),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => QuizScreen(quizId: quiz.id),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ],
                ),
    );
  }
}
