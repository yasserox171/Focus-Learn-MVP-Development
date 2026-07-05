import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state.dart';
import '../widgets/block_renderer.dart';
import 'auth_screen.dart';

class QuizScreen extends StatefulWidget {
  final int quizId;

  const QuizScreen({super.key, required this.quizId});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  Quiz? _quiz;
  bool _failed = false;
  final Map<int, int> _answers = {};
  SubmitResult? _result;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AppState>().api;
    setState(() => _failed = false);
    try {
      final quiz = await api.quiz(widget.quizId);
      if (mounted) setState(() => _quiz = quiz);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _submit() async {
    final app = context.read<AppState>();
    if (_answers.length < _quiz!.questions.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(app.t('answerAll'))),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await app.api.submitQuiz(widget.quizId, _answers);
      if (mounted) setState(() => _result = result);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(app.t('error'))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  CorrectionEntry? _correctionFor(int questionId) {
    if (_result == null) return null;
    for (final entry in _result!.correction) {
      if (entry.questionId == questionId) return entry;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final quiz = _quiz;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(quiz?.title ?? '')),
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
          : quiz == null
              ? const Center(child: CircularProgressIndicator())
              : Directionality(
                  textDirection: quiz.language == 'ar'
                      ? TextDirection.rtl
                      : TextDirection.ltr,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (_result != null)
                        Card(
                          color: theme.colorScheme.primaryContainer,
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              children: [
                                Text(app.t('result'),
                                    style: theme.textTheme.titleMedium),
                                Text(
                                  '${_result!.score.toInt()} / ${_result!.totalQuestions}',
                                  style: theme.textTheme.displaySmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () => setState(() {
                                    _result = null;
                                    _answers.clear();
                                  }),
                                  child: Text(app.t('retake')),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (app.user == null)
                        Card(
                          child: ListTile(
                            leading: const Icon(Icons.lock_outline),
                            title: Text(app.t('loginToTake')),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => const AuthScreen()),
                            ),
                          ),
                        ),
                      for (int i = 0; i < quiz.questions.length; i++)
                        _questionCard(app, theme, quiz, i),
                      const SizedBox(height: 12),
                      if (app.user != null && _result == null)
                        FilledButton(
                          onPressed: _busy ? null : _submit,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Text(app.t('submit')),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  Widget _questionCard(AppState app, ThemeData theme, Quiz quiz, int index) {
    final question = quiz.questions[index];
    final correction = _correctionFor(question.id);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${app.t('question')} ${index + 1} ${app.t('of')} ${quiz.questions.length}',
                    style: theme.textTheme.labelMedium
                        ?.copyWith(color: theme.colorScheme.outline),
                  ),
                ),
                if (correction != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: correction.isCorrect
                          ? Colors.green.shade100
                          : Colors.red.shade100,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      app.t(correction.isCorrect ? 'correct' : 'wrong'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: correction.isCorrect
                            ? Colors.green.shade900
                            : Colors.red.shade900,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            MathText(
              question.text,
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),
            for (final choice in question.choices)
              _choiceTile(theme, question, choice, correction),
          ],
        ),
      ),
    );
  }

  Widget _choiceTile(
    ThemeData theme,
    Question question,
    Choice choice,
    CorrectionEntry? correction,
  ) {
    final selected = _answers[question.id] == choice.id;
    Color? border;
    Color? background;
    if (correction != null) {
      if (choice.id == correction.correctChoiceId) {
        border = Colors.green;
        background = Colors.green.shade50;
      } else if (selected && !correction.isCorrect) {
        border = Colors.red;
        background = Colors.red.shade50;
      }
    } else if (selected) {
      border = theme.colorScheme.primary;
      background = theme.colorScheme.primaryContainer;
    }
    final app = context.read<AppState>();
    final locked = _result != null || app.user == null;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: background,
        border: Border.all(color: border ?? theme.dividerColor, width: 1.4),
        borderRadius: BorderRadius.circular(10),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: locked
            ? null
            : () => setState(() => _answers[question.id] = choice.id),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: MathText(choice.text),
        ),
      ),
    );
  }
}
