import docx
import zipfile

docx_path = r"C:\Users\seaza\Downloads\AquaSmart_Guard.docx"

with zipfile.ZipFile(docx_path, "r") as z:
    media = [f for f in z.namelist() if f.startswith("word/media/")]
    print(f"Media files in docx: {media}")
    print(f"Headers/Footers: {[f for f in z.namelist() if 'header' in f or 'footer' in f]}")
