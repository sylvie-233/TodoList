import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TagPage extends StatefulWidget {
  const TagPage({super.key});
  @override
  State<TagPage> createState() => _TagPageState();
}

class _TagPageState extends State<TagPage> {
  List<Map<String, dynamic>> _tags = [];
  bool _loading = true;
  final _colors = [0xFFEF4444, 0xFFF97316, 0xFFEAB308, 0xFF22C55E, 0xFF3B82F6, 0xFF6366F1, 0xFFA855F7, 0xFFEC4899, 0xFF78716C];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try { final res = await ApiService().dio.get('/tags'); setState(() => _tags = (res.data['data'] as List).cast<Map<String, dynamic>>()); } catch (_) {} setState(() => _loading = false);
  }

  Future<void> _create() async {
    final nameCtrl = TextEditingController();
    int color = 0xFFA855F7;
    final ok = await showDialog<bool>(context: context, builder: (ctx) => StatefulBuilder(builder: (ctx, setDlg) => AlertDialog(
      title: const Text('新建标签'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameCtrl, decoration: const InputDecoration(hintText: '标签名称')),
        const SizedBox(height: 12),
        Wrap(spacing: 8, children: _colors.map((c) => GestureDetector(onTap: () => setDlg(() => color = c), child: Container(width: 28, height: 28, decoration: BoxDecoration(color: Color(c), shape: BoxShape.circle, border: color == c ? Border.all(color: Colors.black, width: 3) : null)))).toList()),
      ]),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('创建'))],
    )));
    if (ok != true || nameCtrl.text.trim().isEmpty) return;
    await ApiService().dio.post('/tags', data: {'name': nameCtrl.text.trim(), 'color': '#${color.toRadixString(16).substring(2)}'});
    _load();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('标签已创建'), duration: Duration(seconds: 1)));
  }

  Future<void> _delete(String id, String name) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: Text('删除 $name'), content: const Text('所有任务上的此标签将被移除'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除'))]));
    if (ok != true) return;
    await ApiService().dio.delete('/tags/$id');
    _load();
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('标签已删除'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('标签管理')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : GridView.builder(padding: const EdgeInsets.all(12), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 2.5), itemCount: _tags.length, itemBuilder: (_, i) {
        final t = _tags[i];
        return Container(
          decoration: BoxDecoration(color: Color(int.parse('0xFF${t['color'].toString().substring(1)}')).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: Color(int.parse('0xFF${t['color'].toString().substring(1)}')))),
          child: InkWell(borderRadius: BorderRadius.circular(20), onTap: () => _delete(t['id'], t['name']), child: Center(child: Text(t['name'], style: TextStyle(fontSize: 13, color: Color(int.parse('0xFF${t['color'].toString().substring(1)}')))))),
        );
      }),
      floatingActionButton: FloatingActionButton(backgroundColor: const Color(0xFF6366F1), onPressed: _create, child: const Icon(Icons.add, color: Colors.white)),
    );
  }
}
