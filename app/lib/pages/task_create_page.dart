import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';

class TaskCreatePage extends StatefulWidget {
  final String? taskId;
  const TaskCreatePage({super.key, this.taskId});
  @override
  State<TaskCreatePage> createState() => _TaskCreatePageState();
}

class _TaskCreatePageState extends State<TaskCreatePage> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String? _dueDate;
  String? _listId;
  String _priority = 'none';
  List<String> _tagIds = [];
  List<Map<String, dynamic>> _lists = [];
  List<Map<String, dynamic>> _tags = [];
  final List<String> _imageUrls = [];
  bool _saving = false;
  bool _isEdit = false;

  @override
  void initState() {
    super.initState();
    _isEdit = widget.taskId != null;
    _loadMeta();
    if (_isEdit) _loadTask();
  }

  Future<void> _loadMeta() async {
    try {
      final lRes = await ApiService().dio.get('/lists');
      _lists = (lRes.data['data'] as List).cast<Map<String, dynamic>>();
      final tRes = await ApiService().dio.get('/tags');
      _tags = (tRes.data['data'] as List).cast<Map<String, dynamic>>();
      setState(() {});
    } catch (_) {}
  }

  Future<void> _loadTask() async {
    try {
      final res = await ApiService().dio.get('/tasks/${widget.taskId}');
      final t = res.data['data'];
      _titleCtrl.text = t['title'] ?? '';
      _descCtrl.text = t['description'] ?? '';
      _dueDate = t['dueDate'];
      _priority = t['priority'] ?? 'none';
      _listId = t['listId'];
      _tagIds = (t['tags'] as List?)?.map((x) => x['id'] as String).toList() ?? [];
      // 加载已有图片
      final imgRes = await ApiService().dio.get('/tasks/${widget.taskId}/images');
      final imgs = (imgRes.data['data'] as List?) ?? [];
      _imageUrls.clear();
      _imageUrls.addAll(imgs.map((img) => img['url'] as String));
      setState(() {});
    } catch (_) {}
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final data = {
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'dueDate': _dueDate,
        'listId': _listId,
        'priority': _priority,
        'tagIds': _tagIds,
        'imageUrls': _imageUrls,
      };
      if (_isEdit) {
        await ApiService().dio.patch('/tasks/${widget.taskId}', data: data);
      } else {
        await ApiService().dio.post('/tasks', data: data);
      }
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(_isEdit ? '任务已保存' : '任务已创建'), duration: const Duration(seconds: 1)));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('保存失败'), duration: Duration(seconds: 1)));
    }
    setState(() => _saving = false);
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    try {
      final bytes = await file.readAsBytes();
      final dio = ApiService().dio;
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: file.name),
      });
      final res = await dio.post('/files/upload', data: formData);
      final url = res.data['data']['url'];
      if (url != null) setState(() => _imageUrls.add(url));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('上传失败'), duration: Duration(seconds: 1)));
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(context: context, initialDate: _dueDate != null ? DateTime.tryParse(_dueDate!) ?? DateTime.now() : DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2028));
    if (picked != null) setState(() => _dueDate = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? '编辑任务' : '新建任务')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: '标题', hintText: '要做什么？', border: OutlineInputBorder())),
        const SizedBox(height: 12),
        TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: '描述', hintText: '添加详情...', border: OutlineInputBorder()), maxLines: 3),
        const SizedBox(height: 12),
        ListTile(title: const Text('截止日期'), subtitle: Text(_dueDate ?? '选择日期'), trailing: const Icon(Icons.chevron_right), onTap: _pickDate),
        ListTile(title: const Text('优先级'), subtitle: Text({'urgent': '紧急', 'high': '高', 'medium': '中', 'low': '低', 'none': '无'}[_priority]!), trailing: DropdownButton<String>(value: _priority, underline: const SizedBox(), items: ['none', 'low', 'medium', 'high', 'urgent'].map((p) => DropdownMenuItem(value: p, child: Text({'urgent': '紧急', 'high': '高', 'medium': '中', 'low': '低', 'none': '无'}[p]!))).toList(), onChanged: (v) => setState(() => _priority = v!))),
        ListTile(title: const Text('清单'), subtitle: Text(_listId != null ? _lists.firstWhere((l) => l['id'] == _listId, orElse: () => {'name': '无'})['name'] ?? '无' : '未分类'), trailing: const Icon(Icons.chevron_right), onTap: () => _pickList()),
        const Divider(),
        Text('标签', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        const SizedBox(height: 8),
        Wrap(spacing: 6, children: _tags.map((t) => FilterChip(label: Text(t['name']), selected: _tagIds.contains(t['id']), onSelected: (v) => setState(() => v ? _tagIds.add(t['id']) : _tagIds.remove(t['id'])))).toList()),
        const Divider(), const SizedBox(height: 8),
        Text('图片', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        const SizedBox(height: 8),
        SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: [
          ..._imageUrls.map((url) => Stack(children: [
            Padding(padding: const EdgeInsets.only(right: 8), child: ClipRRect(borderRadius: BorderRadius.circular(6), child: Image.network(ApiConfig.fullUrl(url), width: 64, height: 64, fit: BoxFit.cover))),
            Positioned(top: 0, right: 8, child: GestureDetector(onTap: () => setState(() => _imageUrls.remove(url)), child: Container(width: 18, height: 18, decoration: BoxDecoration(color: Colors.black54, borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(6))), child: const Icon(Icons.close, size: 14, color: Colors.white)))),
          ])),
          GestureDetector(onTap: _pickImage, child: Container(width: 64, height: 64, decoration: BoxDecoration(border: Border.all(color: Colors.grey[300]!), borderRadius: BorderRadius.circular(6)), child: const Center(child: Icon(Icons.add, color: Colors.grey)))),
        ])),
        const SizedBox(height: 24),
        ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), padding: const EdgeInsets.symmetric(vertical: 14)), onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text(_isEdit ? '保存' : '创建', style: const TextStyle(fontSize: 16, color: Colors.white))),
      ]),
    );
  }

  void _pickList() {
    showModalBottomSheet(context: context, builder: (ctx) => Column(mainAxisSize: MainAxisSize.min, children: [
      ListTile(title: const Text('未分类'), onTap: () { setState(() => _listId = null); Navigator.pop(ctx); }),
      ..._lists.map((l) => ListTile(title: Text(l['name']), onTap: () { setState(() => _listId = l['id']); Navigator.pop(ctx); })),
    ]));
  }

  @override
  void dispose() { _titleCtrl.dispose(); _descCtrl.dispose(); super.dispose(); }
}
