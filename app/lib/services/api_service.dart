import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._();
  factory ApiService() => _instance;

  late final Dio dio;

  ApiService._() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    // 请求拦截：附加 token
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // 401 → 尝试刷新 token
        if (error.response?.statusCode == 401) {
          final prefs = await SharedPreferences.getInstance();
          final refresh = prefs.getString('refreshToken');
          if (refresh != null) {
            try {
              final res = await Dio().post(
                '${ApiConfig.baseUrl}/auth/refresh',
                data: {'refreshToken': refresh},
              );
              final data = res.data['data'];
              await prefs.setString('accessToken', data['accessToken']);
              await prefs.setString('refreshToken', data['refreshToken']);

              // 重试原请求
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer ${data['accessToken']}';
              final retryRes = await Dio().fetch(opts);
              return handler.resolve(retryRes);
            } catch (_) {
              await prefs.clear();
            }
          }
        }
        handler.next(error);
      },
    ));
  }
}
