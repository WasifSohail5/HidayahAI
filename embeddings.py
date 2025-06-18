import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

with open("quran_arabic_chunks.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

model = SentenceTransformer('all-MiniLM-L6-v2')
texts = [chunk["text"] for chunk in chunks]
embeddings = model.encode(texts, show_progress_bar=True)

embeddings = np.array(embeddings).astype("float32")

dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

faiss.write_index(index, "quran_arabic.index")

with open("quran_arabic_metadata.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print(f"FAISS index created with {len(chunks)} chunks.")
