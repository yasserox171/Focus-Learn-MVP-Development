import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state.dart';

/// Combined login/register screen with a configurable server URL.
class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _registerMode = false;
  bool _busy = false;
  String? _error;
  late final TextEditingController _server;
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void initState() {
    super.initState();
    _server = TextEditingController(
      text: context.read<AppState>().api.baseUrl,
    );
  }

  Future<void> _submit() async {
    final app = context.read<AppState>();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await app.api.setServer(_server.text.trim());
      if (_registerMode) {
        await app.register(
          _username.text.trim(),
          _password.text,
          _email.text.trim(),
        );
      } else {
        await app.login(_username.text.trim(), _password.text);
      }
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      setState(() {
        _error = app.t(_registerMode ? 'registerFailed' : 'loginFailed');
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(app.t(_registerMode ? 'register' : 'login')),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                TextField(
                  controller: _username,
                  decoration: InputDecoration(
                    labelText: app.t('username'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                if (_registerMode) ...[
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: app.t('email'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: _password,
                  obscureText: true,
                  onSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: app.t('password'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _server,
                  keyboardType: TextInputType.url,
                  textDirection: TextDirection.ltr,
                  decoration: InputDecoration(
                    labelText: app.t('serverUrl'),
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.dns_outlined),
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(app.t(_registerMode ? 'register' : 'login')),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _registerMode = !_registerMode),
                  child: Text(app.t(_registerMode ? 'haveAccount' : 'noAccount')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
