import json

INPUT_FILE = "quran_arabic.json"        # Change to quran_arabic.json when needed
OUTPUT_FILE = "quran_arabic_chunks.json"

CHUNK_SIZE = 5  # Number of ayahs per chunk

# Load Quran translation
with open(INPUT_FILE, "r", encoding="utf-8") as file:
    quran = json.load(file)

chunks = []
for i in range(0, len(quran), CHUNK_SIZE):
    chunk_text = ""
    for j in range(i, min(i + CHUNK_SIZE, len(quran))):
        ayah = quran[j]
        chunk_text += f"Surah {ayah['surah']}, Ayah {ayah['ayah']}: {ayah['text']}\n"
    chunks.append({
        "chunk_id": len(chunks) + 1,
        "text": chunk_text.strip()
    })

# Save to output file
with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(chunks, file, ensure_ascii=False, indent=2)

print(f"Created {len(chunks)} chunks and saved to '{OUTPUT_FILE}'")
