plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.nosuke.nfctoggle"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nosuke.nfctoggle"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        // 個人用アプリなので固定の署名鍵をリポジトリに同梱。
        // CIでビルドし直しても同じ鍵で署名されるため、上書きインストールできる。
        create("shared") {
            storeFile = file("nfctoggle.keystore")
            storePassword = "nfctoggle"
            keyAlias = "nfctoggle"
            keyPassword = "nfctoggle"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("shared")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("shared")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}
