Version: v0.3-dev
更新日: 2026-10-13
【追加】設計メモ・5軸・役割・目的・分析タグ・未決定・A/B・1要素候補・採用理由
【変更】schemaVersion 3、v1/v2の明示Migrationと退避
【修正】Demo PlayerのKick / Snare / Closed HHに約3msの極短Attackを追加。Noise音を最大Gainから突然開始しないようにして、Androidで聞こえやすい「プツッ」というクリック成分を抑制。Loopは周回終端でStop→play再起動せず、約80ms前から次周をAudioContext時刻へ先行予約して境界の空白/クリックを抑制。Project/MIDI/BPM/ノート位置/保存形式は変更なし
【未対応】DAW領域、クラウド同期、永続候補、Service Worker
【未確認】今回のクリックノイズ/Loop継ぎ目改善をAndroid実機で聴感確認、Cubasis/Cubase実機
