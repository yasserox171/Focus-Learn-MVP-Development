import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:focus_learn/main.dart';
import 'package:focus_learn/state.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('app boots, shows shell, and switches UI language',
      (tester) async {
    SharedPreferences.setMockInitialValues({'fl_ui_lang': 'ar'});
    final state = AppState();
    await state.init();

    await tester.pumpWidget(
      ChangeNotifierProvider.value(value: state, child: const FocusLearnApp()),
    );
    await tester.pump(const Duration(seconds: 1));

    // Shell renders with Arabic UI and RTL direction
    expect(find.text('الدروس'), findsWidgets);
    expect(find.byType(NavigationBar), findsOneWidget);
    final context = tester.element(find.byType(NavigationBar));
    expect(Directionality.of(context), TextDirection.rtl);

    // Guest sees only two tabs (no progress)
    expect(find.byType(NavigationDestination), findsNWidgets(2));

    // Manual language switch flips to French + LTR
    await state.setUiLang('fr');
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Leçons'), findsWidgets);
    final contextFr = tester.element(find.byType(NavigationBar));
    expect(Directionality.of(contextFr), TextDirection.ltr);
  });
}
