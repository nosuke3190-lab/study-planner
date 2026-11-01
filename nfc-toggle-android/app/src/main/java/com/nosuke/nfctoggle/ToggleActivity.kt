package com.nosuke.nfctoggle

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast

/**
 * 画面を持たない透明な Activity。
 * ウィジェット・クイック設定タイルから起動され、NFC を切り替えたらすぐ閉じる。
 */
class ToggleActivity : Activity() {

    private val main = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState != null) return  // パネル表示中の再生成時は何もしない

        when {
            NfcController.state(this) == NfcState.UNSUPPORTED -> {
                Toast.makeText(this, R.string.nfc_unsupported, Toast.LENGTH_SHORT).show()
                finish()
            }
            NfcController.isRootMode(this) -> toggleWithRoot()
            else -> openPanel()
        }
    }

    private fun toggleWithRoot() {
        Thread {
            val result = NfcController.toggleWithRoot(applicationContext)
            main.post {
                if (result == null) {
                    Toast.makeText(this, R.string.root_failed, Toast.LENGTH_SHORT).show()
                    openPanel()
                } else {
                    val msg = if (result == NfcState.ON) R.string.toast_on else R.string.toast_off
                    Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
                    refreshAndFinish()
                }
            }
        }.start()
    }

    private fun openPanel() {
        try {
            @Suppress("DEPRECATION")
            startActivityForResult(NfcController.settingsIntent(), REQ_PANEL)
        } catch (_: ActivityNotFoundException) {
            NfcController.openSettingsFallback(this)
            finish()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_PANEL) refreshAndFinish()
    }

    private fun refreshAndFinish() {
        NfcWidgetProvider.updateAll(this)
        NfcTileService.requestRefresh(this)
        finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
        // 状態変化が少し遅れて反映される端末向けに、もう一度更新しておく
        val app = applicationContext
        main.postDelayed({
            NfcWidgetProvider.updateAll(app)
            NfcTileService.requestRefresh(app)
        }, 1500)
    }

    companion object {
        private const val REQ_PANEL = 1
    }
}
