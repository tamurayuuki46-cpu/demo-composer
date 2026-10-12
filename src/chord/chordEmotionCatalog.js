export const TAG_GROUPS = Object.freeze({
  emotion: [
    "明るい", "切ない", "不安", "希望", "高揚", "優しい", "哀愁", "緊張", "安心"
  ],
  texture: [
    "浮遊感", "透明", "暖かい", "ダーク", "壮大", "開放感", "都会的", "幻想的", "疾走感"
  ],
  scene: [
    "夜", "青春", "雨", "ドライブ", "別れ", "旅立ち", "回想"
  ]
});

const p = (id, degrees, mode, difficulty, tags, note = "") => ({
  id,
  degrees,
  mode,
  difficulty,
  tags,
  note
});

export const CHORD_EMOTION_CATALOG = Object.freeze([
  p("major_001", ["I", "V", "vi", "IV"], "major", "standard", {
    emotion: { "明るい": 5, "希望": 4, "高揚": 3 },
    texture: { "開放感": 4, "疾走感": 3 },
    scene: { "青春": 4, "ドライブ": 3, "旅立ち": 3 }
  }),
  p("major_002", ["IV", "V", "iii", "vi"], "major", "standard", {
    emotion: { "切ない": 5, "哀愁": 4, "希望": 2 },
    texture: { "透明": 3, "浮遊感": 2 },
    scene: { "青春": 5, "別れ": 3, "回想": 3 }
  }),
  p("major_003", ["vi", "IV", "I", "V"], "major", "standard", {
    emotion: { "切ない": 4, "高揚": 4, "希望": 3 },
    texture: { "疾走感": 4, "開放感": 3 },
    scene: { "ドライブ": 4, "青春": 4, "旅立ち": 3 }
  }),
  p("major_004", ["IV", "I", "V", "vi"], "major", "standard", {
    emotion: { "高揚": 5, "希望": 4, "切ない": 3 },
    texture: { "壮大": 3, "開放感": 4 },
    scene: { "青春": 3, "旅立ち": 4 }
  }),
  p("major_005", ["I", "iii", "IV", "V"], "major", "standard", {
    emotion: { "優しい": 5, "安心": 4, "明るい": 3 },
    texture: { "暖かい": 5 },
    scene: { "回想": 3 }
  }),
  p("major_006", ["I", "vi", "IV", "V"], "major", "standard", {
    emotion: { "優しい": 4, "哀愁": 4, "安心": 3 },
    texture: { "暖かい": 4 },
    scene: { "回想": 5, "別れ": 2 }
  }),
  p("major_007", ["ii7", "V7", "Imaj7", "vi7"], "major", "expressive", {
    emotion: { "優しい": 3, "安心": 3 },
    texture: { "都会的": 5, "暖かい": 3 },
    scene: { "夜": 4 }
  }),
  p("major_008", ["IVmaj7", "V", "iii7", "vi7"], "major", "expressive", {
    emotion: { "切ない": 5, "哀愁": 4 },
    texture: { "浮遊感": 5, "透明": 4 },
    scene: { "夜": 4, "雨": 3, "青春": 3 }
  }),
  p("major_009", ["Imaj7", "III7", "vi7", "IVmaj7"], "major", "expressive", {
    emotion: { "切ない": 4, "希望": 2 },
    texture: { "幻想的": 5, "浮遊感": 4, "都会的": 3 },
    scene: { "夜": 5, "雨": 2 }
  }),
  p("major_010", ["I", "IV", "iv", "I"], "major", "expressive", {
    emotion: { "切ない": 5, "哀愁": 5, "安心": 2 },
    texture: { "暖かい": 3 },
    scene: { "回想": 5, "別れ": 4 }
  }, "借用和音ivを含む"),
  p("major_011", ["I", "iii", "vi", "IV"], "major", "standard", {
    emotion: { "優しい": 4, "切ない": 3, "希望": 3 },
    texture: { "透明": 4, "暖かい": 3 },
    scene: { "青春": 3, "回想": 3 }
  }),
  p("major_012", ["I", "bVII", "IV", "I"], "major", "expressive", {
    emotion: { "明るい": 4, "高揚": 4 },
    texture: { "開放感": 5, "壮大": 3 },
    scene: { "ドライブ": 4, "旅立ち": 4 }
  }, "Mixolydian的な響きを作りやすい"),
  p("major_013", ["IV", "V", "vi", "iii", "IV", "I", "ii", "V"], "major", "adventurous", {
    emotion: { "高揚": 5, "希望": 4, "切ない": 2 },
    texture: { "壮大": 5 },
    scene: { "旅立ち": 5, "青春": 3 }
  }),
  p("major_014", ["I", "V/vi", "vi", "IV"], "major", "adventurous", {
    emotion: { "切ない": 4, "高揚": 3 },
    texture: { "壮大": 3, "透明": 2 },
    scene: { "青春": 3, "旅立ち": 3 }
  }, "セカンダリードミナントを含む"),
  p("major_015", ["IVmaj7", "iv6", "iii7", "VI7"], "major", "adventurous", {
    emotion: { "切ない": 5, "緊張": 4, "哀愁": 4 },
    texture: { "浮遊感": 5, "都会的": 4, "幻想的": 3 },
    scene: { "夜": 5, "雨": 4 }
  }, "借用和音とドミナント感を含む"),
  p("minor_001", ["i", "bVI", "bIII", "bVII"], "minor", "standard", {
    emotion: { "切ない": 4, "哀愁": 5 },
    texture: { "ダーク": 4, "壮大": 3 },
    scene: { "夜": 4, "雨": 3 }
  }),
  p("minor_002", ["i", "bVII", "bVI", "V"], "minor", "standard", {
    emotion: { "緊張": 5, "不安": 4, "切ない": 3 },
    texture: { "ダーク": 5, "壮大": 3 },
    scene: { "夜": 4 }
  }),
  p("minor_003", ["i", "iv", "bVI", "V"], "minor", "standard", {
    emotion: { "不安": 5, "緊張": 5, "哀愁": 3 },
    texture: { "ダーク": 4 },
    scene: { "雨": 4, "夜": 3 }
  }),
  p("minor_004", ["i", "bVI", "iv", "V"], "minor", "expressive", {
    emotion: { "不安": 4, "緊張": 5, "切ない": 4 },
    texture: { "ダーク": 5, "幻想的": 2 },
    scene: { "夜": 4, "別れ": 3 }
  }),
  p("minor_005", ["i", "bIII", "bVII", "bVI"], "minor", "standard", {
    emotion: { "哀愁": 4, "切ない": 4 },
    texture: { "壮大": 4, "ダーク": 4 },
    scene: { "回想": 3, "夜": 3 }
  }),
  p("minor_006", ["i", "bVII", "IV", "i"], "minor", "expressive", {
    emotion: { "希望": 3, "哀愁": 3 },
    texture: { "開放感": 3, "浮遊感": 3 },
    scene: { "旅立ち": 3, "夜": 3 }
  }, "Dorian的な明るさを作りやすい"),
  p("minor_007", ["i7", "iv7", "bVII", "bIIImaj7"], "minor", "expressive", {
    emotion: { "哀愁": 4, "優しい": 3 },
    texture: { "都会的": 4, "暖かい": 3 },
    scene: { "夜": 5, "雨": 3 }
  }),
  p("mixed_001", ["vi", "V", "IV", "V"], "mixed", "expressive", {
    emotion: { "切ない": 4, "緊張": 3, "高揚": 3 },
    texture: { "疾走感": 4 },
    scene: { "青春": 4, "ドライブ": 3 }
  }),
  p("mixed_002", ["Imaj7", "IVmaj7", "iii7", "vi7"], "mixed", "expressive", {
    emotion: { "優しい": 4, "切ない": 3, "安心": 3 },
    texture: { "透明": 5, "浮遊感": 4, "暖かい": 3 },
    scene: { "夜": 3, "回想": 3 }
  })
]);
