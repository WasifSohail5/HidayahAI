import json

CHUNK_SIZE = 5  # Number of hadiths per chunk, adjust as needed

# Load processed hadiths
with open("processed_hadith/all_hadiths.json", "r", encoding="utf-8") as f:
    all_hadiths = json.load(f)

chunks = []
for i in range(0, len(all_hadiths), CHUNK_SIZE):
    chunk_text = ""
    chunk_metadata = []

    for j in range(i, min(i + CHUNK_SIZE, len(all_hadiths))):
        hadith = all_hadiths[j]
        chunk_text += f"{hadith['book']}, Hadith {hadith['number']}: {hadith['text']}\n\n"
        chunk_metadata.append({
            "book": hadith["book"],
            "number": hadith["number"]
        })

    chunks.append({
        "chunk_id": len(chunks) + 1,
        "text": chunk_text.strip(),
        "metadata": chunk_metadata
    })

# Save to output file
with open("processed_hadith/hadith_chunks.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"Created {len(chunks)} chunks and saved to 'processed_hadith/hadith_chunks.json'")