import 'package:flutter/material.dart';
import '../models/task.dart';

class TaskCardWidget extends StatelessWidget {
  final Task task;
  final VoidCallback? onTap;
  final VoidCallback onToggle;
  final VoidCallback onDelete;

  const TaskCardWidget({super.key, required this.task, this.onTap, required this.onToggle, required this.onDelete});

  String _dueLabel() {
    if (task.dueDate == null) return '';
    final now = DateTime.now();
    final due = DateTime.tryParse(task.dueDate!) ?? now;
    final diff = due.difference(DateTime(now.year, now.month, now.day)).inDays;
    if (diff == 0) return '今天';
    if (diff == 1) return '明天';
    if (diff < 0) return '逾期${-diff}天';
    return '${due.month}/${due.day}';
  }

  Color _priorityColor() {
    switch (task.priority) {
      case 'urgent': return Colors.red;
      case 'high': return Colors.orange;
      case 'medium': return Colors.yellow.shade700;
      case 'low': return Colors.blue;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(task.id),
      direction: DismissDirection.endToStart,
      background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 20), child: const Icon(Icons.delete, color: Colors.white)),
      confirmDismiss: (_) async {
        onDelete();
        return false; // 手动处理删除
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        child: InkWell(
          onTap: onTap ?? onToggle,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                  onPressed: onToggle,
                  icon: Icon(
                    task.isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: task.isCompleted ? const Color(0xFF6366F1) : Colors.grey,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(task.title, style: TextStyle(fontSize: 15, decoration: task.isCompleted ? TextDecoration.lineThrough : null, color: task.isCompleted ? Colors.grey : null)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (task.dueDate != null) Text('📅 ${_dueLabel()}  ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          if (task.priority != 'none') Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1), decoration: BoxDecoration(border: Border.all(color: _priorityColor()), borderRadius: BorderRadius.circular(8)), child: Text(task.priority == 'urgent' ? '紧急' : task.priority == 'high' ? '高' : task.priority == 'medium' ? '中' : '低', style: TextStyle(fontSize: 11, color: _priorityColor()))),
                          if (task.list != null) Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 8, height: 8, margin: const EdgeInsets.only(right: 3), decoration: BoxDecoration(color: Color(int.parse('0xFF${task.list!.color.substring(1)}')), shape: BoxShape.circle)),
    Text(task.list!.name, style: const TextStyle(fontSize: 11, color: Colors.grey)),
  ]),
                          if (task.subTaskCount != null) Text('  ${task.subTaskCount!.completed}/${task.subTaskCount!.total}', style: const TextStyle(fontSize: 11, color: Color(0xFF6366F1))),
                        ],
                      ),
                      if (task.tags.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Wrap(spacing: 4, children: task.tags.map((t) => Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1), decoration: BoxDecoration(color: Color(int.parse('0xFF${t.color.substring(1)}')).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8), border: Border.all(color: Color(int.parse('0xFF${t.color.substring(1)}')))), child: Text(t.name, style: TextStyle(fontSize: 10, color: Color(int.parse('0xFF${t.color.substring(1)}')))))).toList()),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
