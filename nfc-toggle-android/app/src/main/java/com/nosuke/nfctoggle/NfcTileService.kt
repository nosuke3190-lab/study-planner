package com.nosuke.nfctoggle

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/** 通知シェードのクイック設定タイル */
class NfcTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        render()
    }

    override fun onClick() {
        super.onClick()
        if (NfcController.state(this) == NfcState.UNSUPPORTED) return

        if (NfcController.isRootMode(this)) {
            qsTile?.apply { state = Tile.STATE_UNAVAILABLE; updateTile() }
            val main = Handler(Looper.getMainLooper())
            Thread {
                NfcController.toggleWithRoot(applicationContext)
                main.post {
                    render()
                    NfcWidgetProvider.updateAll(applicationContext)
                }
            }.start()
        } else {
            launchToggleActivity()
        }
    }

    @SuppressLint("StartActivityAndCollapseDeprecated")
    private fun launchToggleActivity() {
        val intent = Intent(this, ToggleActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (Build.VERSION.SDK_INT >= 34) {
            val pending = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            startActivityAndCollapse(pending)
        } else {
            @Suppress("DEPRECATION")
            startActivityAndCollapse(intent)
        }
    }

    private fun render() {
        val tile = qsTile ?: return
        val state = NfcController.state(this)
        tile.state = when (state) {
            NfcState.ON -> Tile.STATE_ACTIVE
            NfcState.OFF -> Tile.STATE_INACTIVE
            NfcState.UNSUPPORTED -> Tile.STATE_UNAVAILABLE
        }
        tile.label = getString(R.string.tile_label)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.subtitle = getString(
                when (state) {
                    NfcState.ON -> R.string.state_on
                    NfcState.OFF -> R.string.state_off
                    NfcState.UNSUPPORTED -> R.string.state_unsupported
                }
            )
        }
        tile.updateTile()
    }

    companion object {
        fun requestRefresh(context: Context) {
            try {
                requestListeningState(context, ComponentName(context, NfcTileService::class.java))
            } catch (_: Exception) {
                // タイルが追加されていない場合など
            }
        }
    }
}
