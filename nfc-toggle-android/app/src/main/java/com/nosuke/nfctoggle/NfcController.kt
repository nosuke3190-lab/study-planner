package com.nosuke.nfctoggle

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import android.os.Build
import android.provider.Settings
import java.util.concurrent.TimeUnit

enum class NfcState { ON, OFF, UNSUPPORTED }

/**
 * NFC の状態取得と切り替えをまとめたクラス。
 *
 * Android は一般アプリに NFC の ON/OFF を直接変更する権限を与えていないため、
 *  - 通常モード : NFC 設定パネル（Android 10 以降は画面下に出るミニパネル）を開く
 *  - root モード: `svc nfc enable|disable` で直接切り替える（root 化端末のみ）
 * の 2 通りで切り替える。
 */
object NfcController {

    private const val PREFS = "nfc_toggle_prefs"
    private const val KEY_ROOT_MODE = "root_mode"

    fun state(context: Context): NfcState {
        val adapter = NfcAdapter.getDefaultAdapter(context) ?: return NfcState.UNSUPPORTED
        return if (adapter.isEnabled) NfcState.ON else NfcState.OFF
    }

    fun isRootMode(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ROOT_MODE, false)

    fun setRootMode(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putBoolean(KEY_ROOT_MODE, enabled).apply()
    }

    /** root で `svc nfc` が使えるか（Android 9 以降）。呼ぶと root 許可ダイアログが出ることがある。 */
    fun checkRoot(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
        return runSu("id") == 0
    }

    /**
     * root で NFC を直接切り替える。ブロッキング処理なのでバックグラウンドスレッドから呼ぶこと。
     * @return 切り替え後の状態。失敗時は null。
     */
    fun toggleWithRoot(context: Context): NfcState? {
        val current = state(context)
        if (current == NfcState.UNSUPPORTED) return null
        val target = if (current == NfcState.ON) NfcState.OFF else NfcState.ON
        val cmd = if (target == NfcState.ON) "svc nfc enable" else "svc nfc disable"
        if (runSu(cmd) != 0) return null
        // NFC の状態変化は非同期なので、最大 3 秒待つ
        repeat(30) {
            if (state(context) == target) return target
            Thread.sleep(100)
        }
        return state(context)
    }

    /** NFC 設定画面（Android 10 以降はミニパネル）を開く Intent */
    fun settingsIntent(): Intent {
        val action = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Settings.Panel.ACTION_NFC
        } else {
            Settings.ACTION_NFC_SETTINGS
        }
        return Intent(action)
    }

    /** パネルが開けない機種向けに、設定画面 → 無線設定画面の順で開く */
    fun openSettingsFallback(context: Context) {
        val candidates = listOf(
            Intent(Settings.ACTION_NFC_SETTINGS),
            Intent(Settings.ACTION_WIRELESS_SETTINGS),
        )
        for (intent in candidates) {
            try {
                context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                return
            } catch (_: ActivityNotFoundException) {
            }
        }
    }

    private fun runSu(command: String): Int = try {
        val process = ProcessBuilder("su", "-c", command).redirectErrorStream(true).start()
        process.inputStream.bufferedReader().use { it.readText() }
        if (process.waitFor(10, TimeUnit.SECONDS)) process.exitValue() else {
            process.destroy()
            -1
        }
    } catch (_: Exception) {
        -1
    }
}
