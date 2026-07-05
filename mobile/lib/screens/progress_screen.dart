import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  Progress? _progress;
  List<Attempt> _attempts = [];
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = context.read<AppState>().api;
    setState(() => _failed = false);
    try {
      final progress = await api.progress();
      final attempts = await api.attempts();
      if (mounted) {
        setState(() {
          _progress = progress;
          _attempts = attempts;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
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
    final progress = _progress;
    if (progress == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.7,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            children: [
              _stat(theme, '${progress.completedLessons}',
                  app.t('completedLessons')),
              _stat(theme, '${progress.viewedLessons}', app.t('viewedLessons')),
              _stat(theme, '${progress.attemptsCount}', app.t('attempts')),
              _stat(
                theme,
                progress.averageScorePct != null
                    ? '${progress.averageScorePct!.toStringAsFixed(0)}%'
                    : '—',
                app.t('avgScore'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            app.t('history'),
            style: theme.textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          if (_attempts.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(app.t('emptyHistory'), textAlign: TextAlign.center),
            )
          else
            for (final attempt in _attempts)
              Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(attempt.quizTitle),
                  subtitle: Text(
                    attempt.completedAt.toLocal().toString().substring(0, 16),
                  ),
                  trailing: Text(
                    '${attempt.score.toInt()}/${attempt.totalQuestions}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
              ),
        ],
      ),
    );
  }

  Widget _stat(ThemeData theme, String value, String label) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                value,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.primary,
                ),
              ),
              Text(
                label,
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
}
