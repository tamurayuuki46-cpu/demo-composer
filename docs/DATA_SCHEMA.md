# DATA_SCHEMA

## project.json 方針
各データには原則1つの責任Moduleを持たせる。

```json
{
  "version": "0.1",
  "project": {
    "name": "",
    "bpm": 120,
    "key": "C",
    "scale": "major",
    "timeSignature": "4/4",
    "genre": [],
    "mood": []
  },
  "intent": {
    "scene": "",
    "referenceTracks": [],
    "tags": {
      "emotion": [],
      "texture": [],
      "scene": []
    }
  },
  "chord": {
    "progression": [],
    "selectedProgressionId": null
  }
}
```

## Ownership
- project.* : Hub
- intent.* : Hub / 作曲シートimport時のみ更新
- chord.* : Chord Module

## Chord progression catalog
推薦用カタログはproject.jsonの正本データとは分離する。

```json
{
  "id": "major_001",
  "degrees": ["I", "V", "vi", "IV"],
  "mode": "major",
  "difficulty": "standard",
  "tags": {
    "emotion": {"明るい": 5, "希望": 4, "高揚": 3},
    "texture": {"開放感": 4},
    "scene": {"青春": 3, "ドライブ": 3}
  }
}
```

重みは1〜5。5ほどその進行から連想されやすい傾向として扱うが、音楽的結果を保証する値ではない。

## Schema変更ルール
project.jsonのキー構造を変更する場合はVERSION、CHANGELOG、AI_HANDOFFを同時更新し、変更前に復元ポイントを作る。
