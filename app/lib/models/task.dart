class Task {
  final String id;
  final String title;
  final String description;
  final String priority;
  bool isCompleted;
  final String? dueDate;
  final String? dueTime;
  final bool isPinned;
  final String? listId;
  final List<TagInfo> tags;
  final ListInfo? list;
  final SubTaskCount? subTaskCount;

  Task({
    required this.id,
    required this.title,
    this.description = '',
    this.priority = 'none',
    this.isCompleted = false,
    this.dueDate,
    this.dueTime,
    this.isPinned = false,
    this.listId,
    this.tags = const [],
    this.list,
    this.subTaskCount,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
    id: json['id'],
    title: json['title'],
    description: json['description'] ?? '',
    priority: json['priority'] ?? 'none',
    isCompleted: json['isCompleted'] ?? false,
    dueDate: json['dueDate'],
    dueTime: json['dueTime'],
    isPinned: json['isPinned'] ?? false,
    listId: json['listId'],
    tags: (json['tags'] as List<dynamic>?)?.map((t) => TagInfo.fromJson(t)).toList() ?? [],
    list: json['list'] != null ? ListInfo.fromJson(json['list']) : null,
    subTaskCount: json['subTaskCount'] != null ? SubTaskCount.fromJson(json['subTaskCount']) : null,
  );
}

class TagInfo {
  final String id;
  final String name;
  final String color;
  TagInfo({required this.id, required this.name, required this.color});
  factory TagInfo.fromJson(Map<String, dynamic> json) => TagInfo(
    id: json['id'], name: json['name'], color: json['color'] ?? '#a855f7',
  );
}

class ListInfo {
  final String id;
  final String name;
  final String color;
  final String icon;
  ListInfo({required this.id, required this.name, required this.color, required this.icon});
  factory ListInfo.fromJson(Map<String, dynamic> json) => ListInfo(
    id: json['id'], name: json['name'], color: json['color'] ?? '#6366f1', icon: json['icon'] ?? 'list',
  );
}

class SubTaskCount {
  final int total;
  final int completed;
  SubTaskCount({required this.total, required this.completed});
  factory SubTaskCount.fromJson(Map<String, dynamic> json) => SubTaskCount(
    total: json['total'] ?? 0, completed: json['completed'] ?? 0,
  );
}
