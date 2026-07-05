import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state.dart';
import 'lesson_detail_screen.dart';

class LessonsScreen extends StatefulWidget {
  const LessonsScreen({super.key});

  @override
  State<LessonsScreen> createState() => _LessonsScreenState();
}

class _LessonsScreenState extends State<LessonsScreen> {
  List<Subject> _subjects = [];
  List<Level> _levels = [];
  List<LessonSummary>? _lessons;
  bool _failed = false;

  String _subject = '';
  String _level = '';
  String _language = '';
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadRefData();
    _loadLessons();
  }

  Future<void> _loadRefData() async {
    final api = context.read<AppState>().api;
    try {
      final subjects = await api.subjects();
      final levels = await api.levels();
      if (mounted) {
        setState(() {
          _subjects = subjects;
          _levels = levels;
        });
      }
    } catch (_) {}
  }

  Future<void> _loadLessons() async {
    final api = context.read<AppState>().api;
    setState(() {
      _lessons = null;
      _failed = false;
    });
    try {
      final lessons = await api.lessons(
        subject: _subject,
        level: _level,
        language: _language,
        search: _search,
      );
      if (mounted) setState(() => _lessons = lessons);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return RefreshIndicator(
      onRefresh: _loadLessons,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: app.t('search'),
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              isDense: true,
            ),
            onSubmitted: (value) {
              _search = value;
              _loadLessons();
            },
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip(
                  label: app.t('subject'),
                  value: _subject,
                  items: {
                    for (final s in _subjects) s.slug: s.name(app.uiLang),
                  },
                  onChanged: (v) {
                    _subject = v;
                    _loadLessons();
                  },
                ),
                const SizedBox(width: 8),
                _filterChip(
                  label: app.t('level'),
                  value: _level,
                  items: {
                    for (final l in _levels) l.slug: l.name(app.uiLang),
                  },
                  onChanged: (v) {
                    _level = v;
                    _loadLessons();
                  },
                ),
                const SizedBox(width: 8),
                _filterChip(
                  label: app.t('language'),
                  value: _language,
                  items: {
                    'ar': app.t('arabic'),
                    'fr': app.t('french'),
                  },
                  onChanged: (v) {
                    _language = v;
                    _loadLessons();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (_failed)
            _ErrorRetry(onRetry: _loadLessons)
          else if (_lessons == null)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_lessons!.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Text(app.t('noLessons'), textAlign: TextAlign.center),
            )
          else
            for (final lesson in _lessons!) _LessonCard(lesson: lesson),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required String value,
    required Map<String, String> items,
    required void Function(String) onChanged,
  }) {
    final app = context.read<AppState>();
    return PopupMenuButton<String>(
      initialValue: value,
      onSelected: (v) => setState(() => onChanged(v)),
      itemBuilder: (context) => [
        PopupMenuItem(value: '', child: Text(app.t('all'))),
        for (final entry in items.entries)
          PopupMenuItem(value: entry.key, child: Text(entry.value)),
      ],
      child: Chip(
        label: Text(
          value.isEmpty ? label : (items[value] ?? label),
          style: const TextStyle(fontSize: 13),
        ),
        avatar: const Icon(Icons.filter_list, size: 16),
        backgroundColor: value.isEmpty
            ? null
            : Theme.of(context).colorScheme.primaryContainer,
      ),
    );
  }
}

class _LessonCard extends StatelessWidget {
  final LessonSummary lesson;

  const _LessonCard({required this.lesson});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => LessonDetailScreen(lessonId: lesson.id),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  _badge(theme, lesson.subject.name(app.uiLang),
                      theme.colorScheme.primaryContainer),
                  _badge(theme, lesson.level.name(app.uiLang),
                      theme.colorScheme.surfaceContainerHighest),
                  _badge(theme, lesson.language.toUpperCase(),
                      theme.colorScheme.tertiaryContainer),
                ],
              ),
              const SizedBox(height: 8),
              Directionality(
                textDirection: lesson.language == 'ar'
                    ? TextDirection.rtl
                    : TextDirection.ltr,
                child: Text(
                  lesson.title,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(ThemeData theme, String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(text, style: theme.textTheme.labelSmall),
      );
}

class _ErrorRetry extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorRetry({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Text(app.t('error'), textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: Text(app.t('retry'))),
        ],
      ),
    );
  }
}
