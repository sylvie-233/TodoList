class ApiConfig {
  // 真机用实际 IP
  static const String baseUrl = 'http://192.168.1.48:3000/api/v1';

  /// 相对路径转完整 URL（图片等静态资源）
  static String fullUrl(String relativePath) {
    if (relativePath.startsWith('http')) return relativePath;
    // /api/v1/files/xxx → http://192.168.1.48:3000/files/xxx
    return 'http://192.168.1.48:3000$relativePath';
  }
}
