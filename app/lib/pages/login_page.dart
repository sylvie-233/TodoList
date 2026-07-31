import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'register_page.dart';
import 'home_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _pwdCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _login() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService().dio.post('/auth/login', data: {
        'email': _emailCtrl.text.trim(),
        'password': _pwdCtrl.text,
      });
      final data = res.data['data'];
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('accessToken', data['tokens']['accessToken']);
      await prefs.setString('refreshToken', data['tokens']['refreshToken']);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HomePage()));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('登录失败，请检查邮箱和密码')));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.symmetric(horizontal: 24), child: Column(children: [
        const SizedBox(height: 60),
        const Text('📋', style: TextStyle(fontSize: 40)),
        const SizedBox(height: 12),
        const Text('TodoList', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF6366F1)), textAlign: TextAlign.center),
        const Text('高效管理你的每一天', style: TextStyle(color: Colors.grey), textAlign: TextAlign.center),
        const SizedBox(height: 40),
        TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: '邮箱', hintText: '请输入邮箱', border: OutlineInputBorder(), prefixIcon: Icon(Icons.email_outlined)), keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 14),
        TextField(controller: _pwdCtrl, decoration: const InputDecoration(labelText: '密码', hintText: '请输入密码', border: OutlineInputBorder(), prefixIcon: Icon(Icons.lock_outlined)), obscureText: true),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(vertical: 14)), onPressed: _loading ? null : _login, child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('登 录', style: TextStyle(fontSize: 16, color: Colors.white)))),
        const SizedBox(height: 16),
        TextButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())), child: const Text('还没有账号？立即注册')),
      ]))),
    );
  }

  @override
  void dispose() { _emailCtrl.dispose(); _pwdCtrl.dispose(); super.dispose(); }
}
