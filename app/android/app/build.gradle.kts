plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val projectRoot = "${project.rootDir.absolutePath}"
val myStoreFile = file("$projectRoot/app/upload-keystore.jks")
val myStorePassword = "123456"
val myKeyAlias = "upload"
val myKeyPassword = "123456"

// 调试打印
println("=".repeat(50))
println("🔍 签名配置调试信息:")
println("📄 storeFile 路径: ${myStoreFile.absolutePath}")
println("📄 storeFile 是否存在: ${myStoreFile.exists()}")
println("🔑 storePassword: ✅ 已设置 (长度: ${myStorePassword.length})")
println("🔑 keyAlias: ✅ 已设置 (值: $myKeyAlias)")
println("🔑 keyPassword: ✅ 已设置 (长度: ${myKeyPassword.length})")
println("=".repeat(50))



android {
    namespace = "com.example.app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        create("release") {
            storeFile = myStoreFile
            storePassword = myStorePassword
            keyAlias = myKeyAlias
            keyPassword = myKeyPassword
        }
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
