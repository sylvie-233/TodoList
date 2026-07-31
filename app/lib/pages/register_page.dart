import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'home_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});
  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _pwdCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _register() async {
    if (_pwdCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('两次密码不一致')));
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ApiService().dio.post('/auth/register', data: {
        'username': _nameCtrl.text.trim(),
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
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('注册失败，请重试')));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('注册')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: '用户名', hintText: '请输入用户名', border: OutlineInputBorder())),
            const SizedBox(height: 14),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: '邮箱', hintText: '请输入邮箱', border: OutlineInputBorder())),
            const SizedBox(height: 14),
            TextField(controller: _pwdCtrl, decoration: const InputDecoration(labelText: '密码', hintText: '至少6位', border: OutlineInputBorder()), obscureText: true),
            const SizedBox(height: 14),
            TextField(controller: _confirmCtrl, decoration: const InputDecoration(labelText: '确认密码', hintText: '再次输入密码', border: OutlineInputBorder()), obscureText: true),
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(vertical: 14)), onPressed: _loading ? null : _register, child: _loading ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('注 册', style: TextStyle(fontSize: 16, color: Colors.white)))),
            const SizedBox(height: 16),
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('已有账号？去登录')),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose(); _pwdCtrl.dispose(); _confirmCtrl.dispose();
    super.dispose();
  }
}
