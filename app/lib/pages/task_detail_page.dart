import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/task.dart';
import 'task_create_page.dart';

class TaskDetailPage extends StatefulWidget {
  final String taskId;
  const TaskDetailPage({super.key, required this.taskId});
  @override
  State<TaskDetailPage> createState() => _TaskDetailPageState();
}

class _TaskDetailPageState extends State<TaskDetailPage> {
  Task? _task;
  List<Map<String, dynamic>> _subtasks = [];
  List<Map<String, dynamic>> _images = [];
  bool _loading = true;
  final _subtaskCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiService().dio.get('/tasks/${widget.taskId}');
      _task = Task.fromJson(res.data['data']);
      final stRes = await ApiService().dio.get('/tasks/${widget.taskId}/sub-tasks');
      _subtasks = (stRes.data['data'] as List).cast<Map<String, dynamic>>();
      final imgRes = await ApiService().dio.get('/tasks/${widget.taskId}/images');
      _images = (imgRes.data['data'] as List).cast<Map<String, dynamic>>();
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _toggleSubtask(Map<String, dynamic> st) async {
    await ApiService().dio.patch('/sub-tasks/${st['id']}/toggle');
    setState(() => st['isCompleted'] = !(st['isCompleted'] ?? false));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('步骤已更新'), duration: Duration(seconds: 1)));
  }

  Future<void> _addSubtask() async {
    if (_subtaskCtrl.text.trim().isEmpty) return;
    final res = await ApiService().dio.post('/sub-tasks', data: {'taskId': widget.taskId, 'text': _subtaskCtrl.text.trim()});
    setState(() { _subtasks.add(res.data['data']); _subtaskCtrl.clear(); });
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('步骤已添加'), duration: Duration(seconds: 1)));
  }

  Future<void> _deleteSubtask(String id) async {
    await ApiService().dio.delete('/sub-tasks/$id');
    setState(() => _subtasks.removeWhere((s) => s['id'] == id));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('步骤已删除'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('任务详情'), actions: [
        PopupMenuButton<String>(onSelected: (v) {
          if (v == 'delete') _deleteTask();
        }, itemBuilder: (_) => const [PopupMenuItem(value: 'delete', child: Text('删除任务'))]),
      ]),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _task == null ? const Center(child: Text('加载失败')) : ListView(
        children: [
          // 卡片头部
          Card(margin: const EdgeInsets.all(12), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_task!.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            if (_task!.description.isNotEmpty) ...[const SizedBox(height: 8), Text(_task!.description, style: const TextStyle(color: Colors.grey))],
            const SizedBox(height: 12),
            Row(children: [
              if (_task!.dueDate != null) ...[const Icon(Icons.calendar_today, size: 14, color: Colors.grey), const SizedBox(width: 4), Text(_task!.dueDate!, style: const TextStyle(fontSize: 13, color: Colors.grey)), const SizedBox(width: 16)],
              if (_task!.list != null) ...[const Icon(Icons.folder, size: 14, color: Colors.grey), const SizedBox(width: 4), Text(_task!.list!.name, style: const TextStyle(fontSize: 13, color: Colors.grey))],
            ]),
            if (_task!.tags.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Wrap(spacing: 4, children: _task!.tags.map((t) => Chip(label: Text(t.name, style: const TextStyle(fontSize: 11)), materialTapTargetSize: MaterialTapTargetSize.shrinkWrap, visualDensity: VisualDensity.compact, backgroundColor: Color(int.parse('0xFF${t.color.substring(1)}')).withValues(alpha: 0.15), side: BorderSide(color: Color(int.parse('0xFF${t.color.substring(1)}'))))).toList())),
          ]))),
          // 子任务
          Card(margin: const EdgeInsets.symmetric(horizontal: 12), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('子任务', style: TextStyle(fontWeight: FontWeight.w600)),
            ..._subtasks.map((st) => ListTile(dense: true, leading: Icon(st['isCompleted'] == true ? Icons.check_circle : Icons.radio_button_unchecked, color: st['isCompleted'] == true ? const Color(0xFF6366F1) : Colors.grey, size: 20), title: Text(st['text'] ?? '', style: TextStyle(fontSize: 14, decoration: st['isCompleted'] == true ? TextDecoration.lineThrough : null, color: st['isCompleted'] == true ? Colors.grey : null)), trailing: IconButton(icon: const Icon(Icons.close, size: 16), onPressed: () => _deleteSubtask(st['id'])), onTap: () => _toggleSubtask(st))),
            Row(children: [Expanded(child: TextField(controller: _subtaskCtrl, decoration: const InputDecoration(hintText: '添加步骤...', border: InputBorder.none, isDense: true), style: const TextStyle(fontSize: 14))), IconButton(icon: const Icon(Icons.add_circle_outline, color: Color(0xFF6366F1)), onPressed: _addSubtask)]),
          ]))),
          // 图片
          if (_images.isNotEmpty) Card(margin: const EdgeInsets.all(12), child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('图片', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(spacing: 6, children: _images.map((img) => GestureDetector(
              onTap: () => _previewImage(img['url']),
              child: ClipRRect(borderRadius: BorderRadius.circular(6), child: Image.network(ApiConfig.fullUrl(img['url']), width: 72, height: 72, fit: BoxFit.cover)),
            )).toList()),
          ]))),
          const SizedBox(height: 80),
        ],
      ),
      bottomNavigationBar: SafeArea(child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [
        Expanded(child: OutlinedButton(onPressed: () => _toggleComplete(), child: Text(_task?.isCompleted == true ? '撤销' : '完成'))),
        const SizedBox(width: 12),
        Expanded(child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)), onPressed: () async {
          final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => TaskCreatePage(taskId: _task!.id)));
          if (result == true) _load();
        }, child: const Text('编辑'))),
      ]))),
    );
  }

  Future<void> _toggleComplete() async {
    await ApiService().dio.patch('/tasks/${_task!.id}/toggle');
    setState(() => _task!.isCompleted = !_task!.isCompleted);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('状态已更新'), duration: Duration(seconds: 1)));
  }

  Future<void> _deleteTask() async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('删除任务'), content: const Text('确定要移到回收站吗？'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除'))]));
    if (ok != true) return;
    await ApiService().dio.delete('/tasks/${_task!.id}');
    if (mounted) { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已移入回收站'), duration: Duration(seconds: 1))); }
  }

  void _previewImage(String url) {
    showDialog(context: context, builder: (_) => Dialog(child: InteractiveViewer(child: Image.network(ApiConfig.fullUrl(url)))));
  }

  @override
  void dispose() { _subtaskCtrl.dispose(); super.dispose(); }
}
