import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/task.dart';
import '../widgets/task_card.dart';
import 'task_detail_page.dart';
import 'task_create_page.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});
  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final List<Task> _tasks = [];
  bool _loading = true;
  int _page = 1;
  int _total = 0;
  final ScrollController _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) _loadTasks();
    });
    _scrollCtrl.addListener(() {
      if (_scrollCtrl.position.pixels > _scrollCtrl.position.maxScrollExtent - 200) {
        _loadMore();
      }
    });
    _loadTasks();
  }

  String _getTabFilter() {
    switch (_tabController.index) {
      case 1: return 'planned';
      case 2: return 'lists';
      default: return 'today';
    }
  }

  Future<void> _loadTasks() async {
    setState(() { _loading = true; _page = 1; });
    try {
      final filter = _getTabFilter();
      String url = '/tasks';
      if (filter == 'today') {
        final res = await ApiService().dio.get('/tasks/today');
        _tasks.clear();
        _tasks.addAll((res.data['data'] as List).map((j) => Task.fromJson(j)));
      } else {
        final res = await ApiService().dio.get(url, queryParameters: {
          if (filter != 'lists') 'status': 'active',
          'page': 1, 'pageSize': 20,
        });
        _tasks.clear();
        _tasks.addAll((res.data['data']['data'] as List).map((j) => Task.fromJson(j)));
        _total = res.data['data']['total'] ?? 0;
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _loadMore() async {
    if (_tasks.length >= _total && _total > 0) return;
    _page++;
    try {
      final res = await ApiService().dio.get('/tasks', queryParameters: {'page': _page, 'pageSize': 20});
      final list = (res.data['data']['data'] as List).map((j) => Task.fromJson(j)).toList();
      setState(() { _tasks.addAll(list); _total = res.data['data']['total'] ?? 0; });
    } catch (_) { _page--; }
  }

  Future<void> _toggleTask(Task task) async {
    try {
      await ApiService().dio.patch('/tasks/${task.id}/toggle');
      setState(() => task.isCompleted = !task.isCompleted);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('状态已更新'), duration: Duration(seconds: 1)));
    } catch (_) {}
  }

  Future<void> _openDetail(Task task) async {
    final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => TaskDetailPage(taskId: task.id)));
    if (result == true) _loadTasks();
  }

  Future<void> _deleteTask(Task task) async {
    final confirm = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('删除任务'),
      content: const Text('确定要移到回收站吗？'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除')),
      ],
    ));
    if (confirm != true) return;
    await ApiService().dio.delete('/tasks/${task.id}');
    setState(() => _tasks.remove(task));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已移入回收站'), duration: Duration(seconds: 1)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('任务'),
        actions: [IconButton(icon: const Icon(Icons.search), onPressed: () {})],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF6366F1),
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: Colors.grey,
          tabs: const [Tab(text: '今天'), Tab(text: '计划'), Tab(text: '清单')],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.only(bottom: 80),
              itemCount: _tasks.length,
              itemBuilder: (_, i) => TaskCardWidget(
                task: _tasks[i],
                onTap: () => _openDetail(_tasks[i]),
                onToggle: () => _toggleTask(_tasks[i]),
                onDelete: () => _deleteTask(_tasks[i]),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF6366F1),
        onPressed: () async {
          final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const TaskCreatePage()));
          if (result == true) _loadTasks();
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }
}
