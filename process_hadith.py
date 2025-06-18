import json
import os

# Define book name mapping for cleaner referencing
BOOK_NAMES = {
    "eng-bukhari": "Sahih Bukhari",
    "eng-muslim": "Sahih Muslim",
    "eng-abudawud": "Sunan Abu Dawood",
    "eng-tirmidhi": "Jami at-Tirmidhi",
    "eng-nasai": "Sunan an-Nasa'i",
    "eng-ibnmajah": "Sunan Ibn Majah"
}

# Create output directory if it doesn't exist
os.makedirs("processed_hadith", exist_ok=True)

all_hadiths = []

# Explicitly list all 6 hadith files - MODIFY THESE PATHS if your files are in a different location
hadith_files = [
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng_bukhari.json",  # Path to Sahih Bukhari
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng_muslim.json",  # Path to Sahih Muslim
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng_dawood.json",  # Path to Sunan Abu Dawood
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng-tirmidhi.json",  # Path to Jami at-Tirmidhi
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng-nasai.json",  # Path to Sunan an-Nasa'i
    r"E:\ML\Islamic Truth Verifier\AHADEES\eng-ibnmajah.json"  # Path to Sunan Ibn Majah
]

# If your files are in a different directory, add the path like this:
# hadith_files = [
#     "path/to/files/eng-bukhari.json",
#     ...
# ]

for filename in hadith_files:
    if os.path.exists(filename):
        book_code = filename.split("/")[-1].replace(".json", "")  # Handle paths if files are in subdirectories
        book_name = BOOK_NAMES.get(book_code, book_code)

        print(f"Processing {book_name}...")

        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract hadiths
        hadiths = data.get("hadiths", [])

        for hadith in hadiths:
            hadith_number = hadith.get("hadithnumber", "")
            text = hadith.get("text", "")

            if text:
                # Create formatted hadith entry
                hadith_entry = {
                    "book": book_name,
                    "number": hadith_number,
                    "text": text,
                    "combined": f"{book_name}, Hadith {hadith_number}: {text}"
                }
                all_hadiths.append(hadith_entry)

        print(f"Extracted {len(hadiths)} hadiths from {book_name}")
    else:
        print(f"Warning: File {filename} not found!")

# Save the processed hadiths
with open("processed_hadith/all_hadiths.json", "w", encoding="utf-8") as f:
    json.dump(all_hadiths, f, ensure_ascii=False, indent=2)

print(f"Total hadiths processed: {len(all_hadiths)}")