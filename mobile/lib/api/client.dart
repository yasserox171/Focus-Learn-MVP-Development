import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// HTTP client for the Focus Learn API with JWT auth and automatic
/// access-token refresh. The server URL is configurable at runtime
/// (default targets a backend running on the same phone, e.g. Termux;
/// use http://10.0.2.2:8000 from the Android emulator).
class ApiClient {
  static const _defaultBaseUrl = 'http://127.0.0.1:8000';
  static const _requestTimeout = Duration(seconds: 12);

  String baseUrl = _defaultBaseUrl;
  String? _access;
  String? _refresh;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    baseUrl = prefs.getString('fl_server') ?? _defaultBaseUrl;
    _access = prefs.getString('fl_access');
    _refresh = prefs.getString('fl_refresh');
  }

  bool get isLoggedIn => _access != null;

  Future<void> setServer(String url) async {
    baseUrl = url.replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fl_server', baseUrl);
  }

  Future<void> _storeTokens(String access, String? refresh) async {
    _access = access;
    if (refresh != null) _refresh = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fl_access', access);
    if (refresh != null) await prefs.setString('fl_refresh', refresh);
  }

  Future<void> clearTokens() async {
    _access = null;
    _refresh = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('fl_access');
    await prefs.remove('fl_refresh');
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('$baseUrl/api$path').replace(
        queryParameters: (query?.isEmpty ?? true) ? null : query,
      );

  Map<String, String> _headers() => {
        'Content-Type': 'application/json',
        if (_access != null) 'Authorization': 'Bearer $_access',
      };

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    bool retried = false,
  }) async {
    final uri = _uri(path, query);
    late http.Response response;
    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: _headers()).timeout(_requestTimeout);
      case 'POST':
        response = await http
            .post(uri, headers: _headers(), body: encoded)
            .timeout(_requestTimeout);
      case 'PATCH':
        response = await http
            .patch(uri, headers: _headers(), body: encoded)
            .timeout(_requestTimeout);
      default:
        throw ArgumentError('Unsupported method $method');
    }

    if (response.statusCode == 401 && _refresh != null && !retried) {
      final ok = await _tryRefresh();
      if (ok) {
        return _send(method, path, query: query, body: body, retried: true);
      }
      await clearTokens();
    }

    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, utf8.decode(response.bodyBytes));
    }
    if (response.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  Future<bool> _tryRefresh() async {
    try {
      final response = await http
          .post(
            _uri('/auth/refresh/'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refresh': _refresh}),
          )
          .timeout(_requestTimeout);
      if (response.statusCode != 200) return false;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      await _storeTokens(
        data['access'] as String,
        data['refresh'] as String?,
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  // ---- Auth ----

  Future<User> login(String username, String password) async {
    final data = await _send('POST', '/auth/login/', body: {
      'username': username,
      'password': password,
    }) as Map<String, dynamic>;
    await _storeTokens(data['access'] as String, data['refresh'] as String?);
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> register({
    required String username,
    required String password,
    String? email,
    String uiLanguage = 'ar',
  }) async {
    await _send('POST', '/auth/register/', body: {
      'username': username,
      'password': password,
      if (email != null && email.isNotEmpty) 'email': email,
      'preferred_ui_language': uiLanguage,
    });
  }

  Future<User> me() async {
    final data = await _send('GET', '/me/') as Map<String, dynamic>;
    return User.fromJson(data);
  }

  Future<void> updateUiLanguage(String lang) async {
    if (!isLoggedIn) return;
    await _send('PATCH', '/me/', body: {'preferred_ui_language': lang});
  }

  // ---- Reference data ----

  Future<List<Subject>> subjects() async {
    final data = await _send('GET', '/subjects/') as List;
    return data
        .map((s) => Subject.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<List<Level>> levels() async {
    final data = await _send('GET', '/levels/') as List;
    return data.map((l) => Level.fromJson(l as Map<String, dynamic>)).toList();
  }

  // ---- Lessons ----

  Future<List<LessonSummary>> lessons({
    String? subject,
    String? level,
    String? language,
    String? search,
  }) async {
    final data = await _send('GET', '/lessons/', query: {
      if (subject != null && subject.isNotEmpty) 'subject': subject,
      if (level != null && level.isNotEmpty) 'level': level,
      if (language != null && language.isNotEmpty) 'language': language,
      if (search != null && search.isNotEmpty) 'search': search,
    }) as Map<String, dynamic>;
    return ((data['results'] as List?) ?? [])
        .map((l) => LessonSummary.fromJson(l as Map<String, dynamic>))
        .toList();
  }

  Future<Lesson> lesson(int id) async {
    final data = await _send('GET', '/lessons/$id/') as Map<String, dynamic>;
    return Lesson.fromJson(data);
  }

  Future<void> markLessonCompleted(int id) async {
    await _send('POST', '/lessons/$id/complete/', body: {'completed': true});
  }

  // ---- Quizzes ----

  Future<List<QuizSummary>> quizzes({
    int? lessonId,
    String? level,
    String? language,
    String? quizType,
  }) async {
    final data = await _send('GET', '/quizzes/', query: {
      if (lessonId != null) 'lesson': '$lessonId',
      if (level != null && level.isNotEmpty) 'level': level,
      if (language != null && language.isNotEmpty) 'language': language,
      if (quizType != null && quizType.isNotEmpty) 'quiz_type': quizType,
    }) as Map<String, dynamic>;
    return ((data['results'] as List?) ?? [])
        .map((q) => QuizSummary.fromJson(q as Map<String, dynamic>))
        .toList();
  }

  Future<Quiz> quiz(int id) async {
    final data = await _send('GET', '/quizzes/$id/') as Map<String, dynamic>;
    return Quiz.fromJson(data);
  }

  Future<SubmitResult> submitQuiz(int id, Map<int, int> answers) async {
    final data = await _send('POST', '/quizzes/$id/submit/', body: {
      'answers': answers.map((k, v) => MapEntry('$k', v)),
    }) as Map<String, dynamic>;
    return SubmitResult.fromJson(data);
  }

  // ---- Progress ----

  Future<Progress> progress() async {
    final data = await _send('GET', '/me/progress/') as Map<String, dynamic>;
    return Progress.fromJson(data);
  }

  Future<List<Attempt>> attempts() async {
    final data = await _send('GET', '/me/attempts/') as Map<String, dynamic>;
    return ((data['results'] as List?) ?? [])
        .map((a) => Attempt.fromJson(a as Map<String, dynamic>))
        .toList();
  }
}
