import json
data = []
with open("ar.jalalayn.txt", "r", encoding="utf-8") as file:
    for line in file:
        parts = line.strip().split("|")
        if len(parts) == 3:
            surah = int(parts[0])
            ayah = int(parts[1])
            text = parts[2].strip()
            data.append({
                "surah": surah,
                "ayah": ayah,
                "text": text
            })

# Step 2: Save to JSON
with open("quran_arabic.json", "w", encoding="utf-8") as json_file:
    json.dump(data, json_file, ensure_ascii=False, indent=2)

print(f"✅ Converted {len(data)} ayahs to 'quran_english.json'")
