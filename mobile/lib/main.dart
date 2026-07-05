import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/auth_screen.dart';
import 'screens/lessons_screen.dart';
import 'screens/progress_screen.dart';
import 'screens/quizzes_screen.dart';
import 'state.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  state.init();
  runApp(
    ChangeNotifierProvider.value(value: state, child: const FocusLearnApp()),
  );
}

class FocusLearnApp extends StatelessWidget {
  const FocusLearnApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return MaterialApp(
      title: 'Focus Learn',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4353FF)),
        useMaterial3: true,
      ),
      // The whole UI direction follows the interface language; each
      // lesson/quiz body overrides direction from its own content language.
      builder: (context, child) => Directionality(
        textDirection: app.direction,
        child: child ?? const SizedBox.shrink(),
      ),
      home: app.ready ? const HomeShell() : const _Splash(),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final loggedIn = app.user != null;

    final pages = <Widget>[
      const LessonsScreen(),
      const QuizzesScreen(),
      if (loggedIn) const ProgressScreen(),
    ];
    final tab = _tab.clamp(0, pages.length - 1);

    return Scaffold(
      appBar: AppBar(
        title: Text(app.t('appName')),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.language),
            tooltip: app.t('uiLanguage'),
            onSelected: app.setUiLang,
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'ar',
                child: Row(
                  children: [
                    if (app.uiLang == 'ar') const Icon(Icons.check, size: 16),
                    const SizedBox(width: 6),
                    Text(app.t('arabic')),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'fr',
                child: Row(
                  children: [
                    if (app.uiLang == 'fr') const Icon(Icons.check, size: 16),
                    const SizedBox(width: 6),
                    Text(app.t('french')),
                  ],
                ),
              ),
            ],
          ),
          if (loggedIn)
            IconButton(
              icon: const Icon(Icons.logout),
              tooltip: app.t('logout'),
              onPressed: () {
                app.logout();
                setState(() => _tab = 0);
              },
            )
          else
            IconButton(
              icon: const Icon(Icons.login),
              tooltip: app.t('login'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AuthScreen()),
              ),
            ),
        ],
      ),
      body: pages[tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.menu_book_outlined),
            selectedIcon: const Icon(Icons.menu_book),
            label: app.t('lessons'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.quiz_outlined),
            selectedIcon: const Icon(Icons.quiz),
            label: app.t('quizzes'),
          ),
          if (loggedIn)
            NavigationDestination(
              icon: const Icon(Icons.insights_outlined),
              selectedIcon: const Icon(Icons.insights),
              label: app.t('progress'),
            ),
        ],
      ),
    );
  }
}
