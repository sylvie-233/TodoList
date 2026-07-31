import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ListPage extends StatefulWidget {
  const ListPage({super.key});
  @override
  State<ListPage> createState() => _ListPageState();
}

class _ListPageState extends State<ListPage> {
  List<Map<String, dynamic>> _lists = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try { final res = await ApiService().dio.get('/lists'); setState(() => _lists = (res.data['data'] as List).cast<Map<String, dynamic>>()); } catch (_) {} setState(() => _loading = false);
  }

  Future<void> _create() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('新建清单'), content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: '清单名称')), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('创建'))]));
    if (ok != true || ctrl.text.trim().isEmpty) return;
    await ApiService().dio.post('/lists', data: {'name': ctrl.text.trim()});
    _load();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('清单已创建'), duration: Duration(seconds: 1)));
  }

  Future<void> _delete(String id, String name) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: Text('删除 $name'), content: const Text('清单下的任务不会被删除，仅取消关联'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除'))]));
    if (ok != true) return;
    await ApiService().dio.delete('/lists/$id');
    _load();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('清单已删除'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('清单管理')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(
        itemCount: _lists.length,
        itemBuilder: (_, i) => ListTile(
          title: Text(_lists[i]['name']),
          trailing: _lists[i]['isBuiltin'] == true ? null : IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(_lists[i]['id'], _lists[i]['name'])),
        ),
      ),
      floatingActionButton: FloatingActionButton(backgroundColor: const Color(0xFF6366F1), onPressed: _create, child: const Icon(Icons.add, color: Colors.white)),
    );
  }
}
