import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'login_page.dart';
import 'list_page.dart';
import 'tag_page.dart';
import 'recycle_bin_page.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});
  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _username = '';
  String _email = '';

  @override
  void initState() { super.initState(); _loadProfile(); }

  Future<void> _loadProfile() async {
    try {
      final res = await ApiService().dio.get('/users/me');
      setState(() { _username = res.data['data']['username'] ?? ''; _email = res.data['data']['email'] ?? ''; });
    } catch (_) {}
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('退出登录'), content: const Text('确定要退出当前账号吗？'),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('退出'))],
    ));
    if (confirm != true) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginPage()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('设置')),
      body: ListView(children: [
        const SizedBox(height: 12),
        Card(margin: const EdgeInsets.symmetric(horizontal: 12), child: Column(children: [
          ListTile(title: const Text('用户名'), trailing: Text(_username)),
          const Divider(height: 1), ListTile(title: const Text('邮箱'), trailing: Text(_email)),
        ])),
        const SizedBox(height: 12),
        Card(margin: const EdgeInsets.symmetric(horizontal: 12), child: Column(children: [
          ListTile(title: const Text('清单管理'), leading: const Icon(Icons.folder_outlined), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ListPage()))),
          const Divider(height: 1), ListTile(title: const Text('标签管理'), leading: const Icon(Icons.label_outline), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TagPage()))),
          const Divider(height: 1), ListTile(title: const Text('回收站'), leading: const Icon(Icons.delete_outline), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RecycleBinPage()))),
        ])),
        const SizedBox(height: 24),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.red, padding: const EdgeInsets.symmetric(vertical: 14)), onPressed: _logout, child: const Text('退出登录', style: TextStyle(color: Colors.white)))),
      ]),
    );
  }
}
