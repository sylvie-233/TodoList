import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../services/api_service.dart';
import '../models/task.dart';
import '../widgets/task_card.dart';

class CalendarPage extends StatefulWidget {
  final void Function(int tab) onSwitchTab;
  const CalendarPage({super.key, required this.onSwitchTab});
  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  DateTime _selectedDay = DateTime.now();
  DateTime _focusedDay = DateTime.now();
  final List<Task> _dayTasks = [];
  bool _loading = false;
  final Set<DateTime> _taskDates = {};

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('zh_CN');
    _loadAllTasks();
  }

  Future<void> _loadAllTasks() async {
    try {
      final res = await ApiService().dio.get('/tasks', queryParameters: {'pageSize': 500});
      final tasks = (res.data['data']['data'] as List).map((j) => Task.fromJson(j)).toList();
      _taskDates.clear();
      for (final t in tasks) {
        if (t.dueDate != null) {
          _taskDates.add(DateTime.parse(t.dueDate!));
        }
      }
      _loadDayTasks();
    } catch (_) {}
  }

  Future<void> _loadDayTasks() async {
    setState(() => _loading = true);
    final d = '${_selectedDay.year}-${_selectedDay.month.toString().padLeft(2, '0')}-${_selectedDay.day.toString().padLeft(2, '0')}';
    try {
      final res = await ApiService().dio.get('/tasks', queryParameters: {'dateFrom': d, 'dateTo': d, 'pageSize': 100});
      _dayTasks.clear();
      _dayTasks.addAll((res.data['data']['data'] as List).map((j) => Task.fromJson(j)));
    } catch (_) {}
    setState(() => _loading = false);
  }

  bool _hasTask(DateTime day) {
    final d = DateTime(day.year, day.month, day.day);
    return _taskDates.any((t) => t.year == d.year && t.month == d.month && t.day == d.day);
  }

  @override
  Widget build(BuildContext context) {
    final isToday = _selectedDay.year == DateTime.now().year &&
        _selectedDay.month == DateTime.now().month &&
        _selectedDay.day == DateTime.now().day;

    return Scaffold(
      appBar: AppBar(title: const Text('日历')),
      body: Column(
        children: [
          TableCalendar(
            startingDayOfWeek: StartingDayOfWeek.sunday,
            firstDay: DateTime(2024),
            lastDay: DateTime(2028),
            focusedDay: _focusedDay,
            selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
            onDaySelected: (selected, focused) {
              setState(() { _selectedDay = selected; _focusedDay = focused; });
              _loadDayTasks();
            },
            onPageChanged: (focused) => _focusedDay = focused,
            calendarStyle: CalendarStyle(
              todayDecoration: BoxDecoration(color: const Color(0xFF6366F1).withValues(alpha: 0.3), shape: BoxShape.circle),
              selectedDecoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle),
              markerDecoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle),
            ),
            calendarBuilders: CalendarBuilders(
              markerBuilder: (ctx, date, _) {
                if (_hasTask(date)) {
                  return Positioned(bottom: 1, child: Container(width: 5, height: 5, decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle)));
                }
                return null;
              },
            ),
            headerStyle: const HeaderStyle(formatButtonVisible: false, titleCentered: true),
            locale: 'zh_CN',
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _dayTasks.isEmpty
                    ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.event_note, size: 48, color: Colors.grey[300]),
                        const SizedBox(height: 8),
                        Text(isToday ? '今天没有任务' : '这一天没有任务', style: TextStyle(color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text('去任务页创建带截止日期的任务', style: TextStyle(fontSize: 12, color: Colors.grey[400])),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(icon: const Icon(Icons.add), label: const Text('创建任务'), onPressed: () => widget.onSwitchTab(0)),
                      ]))
                    : Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
                            child: Text(isToday ? '今天 · ${_dayTasks.length} 个任务' : '${_selectedDay.month}月${_selectedDay.day}日 · ${_dayTasks.length} 个任务', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          ),
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.only(bottom: 80),
                              itemCount: _dayTasks.length,
                              itemBuilder: (_, i) => TaskCardWidget(
                                task: _dayTasks[i], onToggle: () => _toggleTask(_dayTasks[i]), onDelete: () => _deleteTask(_dayTasks[i]),
                              ),
                            ),
                          ),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleTask(Task task) async {
    try { await ApiService().dio.patch('/tasks/${task.id}/toggle'); setState(() => task.isCompleted = !task.isCompleted); if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('状态已更新'), duration: Duration(seconds: 1))); } catch (_) {}
  }

  Future<void> _deleteTask(Task task) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('删除任务'), content: const Text('确定要移到回收站吗？'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')), TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('删除'))]));
    if (ok != true) return;
    await ApiService().dio.delete('/tasks/${task.id}');
    setState(() => _dayTasks.remove(task));
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已移入回收站'), duration: Duration(seconds: 1)));
  }
}
