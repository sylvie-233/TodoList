import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RecycleBinPage extends StatefulWidget {
  const RecycleBinPage({super.key});
  @override
  State<RecycleBinPage> createState() => _RecycleBinPageState();
}

class _RecycleBinPageState extends State<RecycleBinPage> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;
  final int _page = 1;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiService().dio.get('/tasks/recycle-bin', queryParameters: {'page': _page});
      _tasks = (res.data['data']['data'] as List).cast<Map<String, dynamic>>();
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _restore(String id) async {
    await ApiService().dio.patch('/tasks/$id/restore');
    setState(() => _tasks.removeWhere((t) => t['id'] == id));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('任务已恢复'), duration: Duration(seconds: 1)));
  }

  Future<void> _permanentDelete(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('永久删除'), content: const Text('删除后无法恢复，确定继续？'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除'))]));
    if (ok != true) return;
    await ApiService().dio.delete('/tasks/$id/permanent');
    setState(() => _tasks.removeWhere((t) => t['id'] == id));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('任务已永久删除'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('回收站'), actions: [TextButton(onPressed: () async {
        final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('清空回收站'), content: const Text('将永久删除所有任务'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('全部删除'))]));
        if (ok != true) return;
        await ApiService().dio.post('/tasks/batch', data: {'action': 'delete', 'taskIds': _tasks.map((t) => t['id']).toList()});
        setState(() => _tasks.clear());
      }, child: const Text('清空', style: TextStyle(color: Colors.red)))]),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _tasks.isEmpty ? const Center(child: Text('回收站是空的', style: TextStyle(color: Colors.grey))) : ListView.builder(itemCount: _tasks.length, itemBuilder: (_, i) => Dismissible(
        key: Key(_tasks[i]['id']),
        direction: DismissDirection.endToStart,
        background: Container(color: Colors.green, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 20), child: const Text('恢复', style: TextStyle(color: Colors.white))),
        secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerLeft, padding: const EdgeInsets.only(left: 20), child: const Text('删除', style: TextStyle(color: Colors.white))),
        confirmDismiss: (dir) async {
          if (dir == DismissDirection.endToStart) { _restore(_tasks[i]['id']); return false; }
          _permanentDelete(_tasks[i]['id']); return false;
        },
        child: ListTile(title: Text(_tasks[i]['title'] ?? ''), subtitle: Text('已删除于 ${_tasks[i]['createdAt'] ?? ''}')),
      )),
    );
  }
}
