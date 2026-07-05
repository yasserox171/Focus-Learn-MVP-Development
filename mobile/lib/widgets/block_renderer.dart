import 'package:flutter/material.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models.dart';

/// Renders text that may contain inline `$...$` LaTeX segments.
class MathText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const MathText(this.text, {super.key, this.style});

  @override
  Widget build(BuildContext context) {
    final effectiveStyle = style ?? DefaultTextStyle.of(context).style;
    final spans = <InlineSpan>[];
    final regex = RegExp(r'\$([^$]+)\$');
    int index = 0;
    for (final match in regex.allMatches(text)) {
      if (match.start > index) {
        spans.add(TextSpan(text: text.substring(index, match.start)));
      }
      spans.add(WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: Math.tex(
          match.group(1)!,
          textStyle: effectiveStyle,
          onErrorFallback: (_) => Text(match.group(0)!, style: effectiveStyle),
        ),
      ));
      index = match.end;
    }
    if (index < text.length) {
      spans.add(TextSpan(text: text.substring(index)));
    }
    return Text.rich(TextSpan(style: effectiveStyle, children: spans));
  }
}

/// Renders the agreed `content.blocks` lesson structure — the exact same
/// JSON the React frontend renders on the web.
class BlockRenderer extends StatelessWidget {
  final List<ContentBlock> blocks;

  const BlockRenderer({super.key, required this.blocks});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final block in blocks) _buildBlock(context, theme, block),
      ],
    );
  }

  Widget _buildBlock(BuildContext context, ThemeData theme, ContentBlock block) {
    switch (block.type) {
      case 'heading':
        return Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 8),
          child: MathText(
            block.text ?? '',
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
        );
      case 'paragraph':
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: MathText(block.text ?? '', style: theme.textTheme.bodyLarge),
        );
      case 'latex':
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Math.tex(
                block.text ?? '',
                textStyle: theme.textTheme.titleMedium,
                onErrorFallback: (_) => Text(block.text ?? ''),
              ),
            ),
          ),
        );
      case 'image':
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(
                  block.url ?? '',
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.broken_image, size: 48),
                ),
              ),
              if (block.caption != null && block.caption!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    block.caption!,
                    style: theme.textTheme.bodySmall,
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        );
      case 'video':
        return VideoLinkCard(url: block.url ?? '');
      default:
        return const SizedBox.shrink();
    }
  }
}

/// YouTube videos open externally (no embedded player in the MVP,
/// mirroring the "unlisted YouTube links" content strategy).
class VideoLinkCard extends StatelessWidget {
  final String url;
  final String? label;

  const VideoLinkCard({super.key, required this.url, this.label});

  String? get _videoId {
    for (final pattern in [
      RegExp(r'youtube\.com/watch\?.*v=([\w-]{11})'),
      RegExp(r'youtu\.be/([\w-]{11})'),
      RegExp(r'youtube\.com/embed/([\w-]{11})'),
      RegExp(r'youtube\.com/shorts/([\w-]{11})'),
    ]) {
      final match = pattern.firstMatch(url);
      if (match != null) return match.group(1);
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final id = _videoId;
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: InkWell(
        onTap: () => launchUrl(
          Uri.parse(url),
          mode: LaunchMode.externalApplication,
        ),
        child: Column(
          children: [
            if (id != null)
              Stack(
                alignment: Alignment.center,
                children: [
                  Image.network(
                    'https://img.youtube.com/vi/$id/hqdefault.jpg',
                    width: double.infinity,
                    height: 180,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox(height: 60),
                  ),
                  const Icon(Icons.play_circle_fill,
                      size: 64, color: Colors.white),
                ],
              ),
            ListTile(
              leading: const Icon(Icons.ondemand_video),
              title: Text(label ?? url, maxLines: 1, overflow: TextOverflow.ellipsis),
              trailing: const Icon(Icons.open_in_new, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}
