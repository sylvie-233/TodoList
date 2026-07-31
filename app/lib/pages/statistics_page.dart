import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';

class StatisticsPage extends StatefulWidget {
  const StatisticsPage({super.key});
  @override
  State<StatisticsPage> createState() => _StatisticsPageState();
}

class _StatisticsPageState extends State<StatisticsPage> {
  Map<String, dynamic>? _dashboard;
  List<Map<String, dynamic>> _trends = [];
  List<Map<String, dynamic>> _overdueItems = [];
  int _overdueTotal = 0;
  int _days = 7;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final ds = await ApiService().dio.get('/statistics/dashboard');
      _dashboard = ds.data['data'];
      final tr = await ApiService().dio.get('/statistics/trends', queryParameters: {'days': _days});
      _trends = (tr.data['data'] as List).cast<Map<String, dynamic>>();
      final ov = await ApiService().dio.get('/statistics/overdue');
      _overdueTotal = ov.data['data']['total'] ?? 0;
      _overdueItems = (ov.data['data']['items'] as List).cast<Map<String, dynamic>>();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('统计')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(padding: const EdgeInsets.all(12), children: [
              if (_dashboard != null) _buildKPIs(),
              const SizedBox(height: 16),
              _buildChart(),
              if (_overdueItems.isNotEmpty) ...[const SizedBox(height: 12), _buildOverdue()],
            ]),
    );
  }

  Widget _buildKPIs() {
    return GridView.count(
      crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 1.6,
      children: [
        _kpi('${_dashboard!['totalTasks']}', '全部任务'),
        _kpi('${_dashboard!['completedTasks']}', '已完成'),
        _kpi('${_dashboard!['completionRate']}%', '完成率'),
        _kpi('${_dashboard!['overdueCount']}', '已逾期'),
      ],
    );
  }

  Widget _kpi(String val, String label) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(val, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF6366F1))),
        const SizedBox(height: 4), Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ]),
    ),
  );

  Widget _buildChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('近 $_days 天完成趋势', style: const TextStyle(fontWeight: FontWeight.w600)),
            Row(children: [
              ChoiceChip(label: const Text('7天'), selected: _days == 7, onSelected: (_) { _days = 7; _loadData(); }),
              const SizedBox(width: 4),
              ChoiceChip(label: const Text('30天'), selected: _days == 30, onSelected: (_) { _days = 30; _loadData(); }),
            ]),
          ]),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: _trends.isEmpty
                ? const Center(child: Text('暂无数据', style: TextStyle(color: Colors.grey)))
                : _days == 7 ? BarChart(_barData()) : LineChart(_lineData()),
          ),
        ]),
      ),
    );
  }

  BarChartData _barData() {
    return BarChartData(
      gridData: const FlGridData(show: false),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) {
          final i = v.toInt();
          if (i >= _trends.length) return const SizedBox.shrink();
          return Text((_trends[i]['date'] as String).substring(5), style: const TextStyle(fontSize: 9, color: Colors.grey));
        }, reservedSize: 22)),
        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      barGroups: _trends.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
        BarChartRodData(toY: (e.value['completed'] as num).toDouble(), color: const Color(0xFF818CF8), width: _days == 7 ? 16 : 6, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
      ])).toList(),
    );
  }

  LineChartData _lineData() {
    final spots = _trends.asMap().entries.map((e) => FlSpot(e.key.toDouble(), (e.value['completed'] as num).toDouble())).toList();
    return LineChartData(
      gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (_) => FlLine(color: Colors.grey.withValues(alpha: 0.1), strokeWidth: 1)),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, interval: 5, getTitlesWidget: (v, _) {
          final i = v.toInt();
          if (i >= _trends.length) return const SizedBox.shrink();
          return Text((_trends[i]['date'] as String).substring(5), style: const TextStyle(fontSize: 9, color: Colors.grey));
        }, reservedSize: 22)),
        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [LineChartBarData(spots: spots, color: const Color(0xFF6366F1), barWidth: 2, isCurved: true, dotData: const FlDotData(show: false), belowBarData: BarAreaData(show: true, color: const Color(0xFF6366F1).withValues(alpha: 0.1)))],
    );
  }

  Widget _buildOverdue() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('逾期任务 ($_overdueTotal)', style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ..._overdueItems.take(10).map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Text(item['title'] ?? '', overflow: TextOverflow.ellipsis)),
              Text('逾期 ${item['daysOverdue']} 天', style: const TextStyle(color: Colors.red, fontSize: 12)),
            ]),
          )),
        ]),
      ),
    );
  }
}
