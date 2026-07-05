import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/client.dart';
import 'l10n.dart';
import 'models.dart';

/// Global app state: API client, current user, UI language.
class AppState extends ChangeNotifier {
  final ApiClient api = ApiClient();

  User? user;
  String uiLang = 'ar';
  bool ready = false;

  Future<void> init() async {
    await api.init();
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('fl_ui_lang');
    if (saved != null) {
      uiLang = saved;
    } else {
      // First run: follow the device language, defaulting to Arabic
      final device = WidgetsBinding.instance.platformDispatcher.locale;
      uiLang = device.languageCode == 'fr' ? 'fr' : 'ar';
    }
    if (api.isLoggedIn) {
      try {
        user = await api.me();
        uiLang = user!.preferredUiLanguage;
      } catch (_) {
        await api.clearTokens();
      }
    }
    ready = true;
    notifyListeners();
  }

  String t(String key) => tr(uiLang, key);

  TextDirection get direction =>
      uiLang == 'ar' ? TextDirection.rtl : TextDirection.ltr;

  Future<void> setUiLang(String lang) async {
    uiLang = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fl_ui_lang', lang);
    notifyListeners();
    // Persist to the account too, like the web frontend does
    try {
      await api.updateUiLanguage(lang);
    } catch (_) {}
  }

  Future<void> login(String username, String password) async {
    user = await api.login(username, password);
    uiLang = user!.preferredUiLanguage;
    notifyListeners();
  }

  Future<void> register(String username, String password, String email) async {
    await api.register(
      username: username,
      password: password,
      email: email,
      uiLanguage: uiLang,
    );
    await login(username, password);
  }

  Future<void> logout() async {
    await api.clearTokens();
    user = null;
    notifyListeners();
  }
}
