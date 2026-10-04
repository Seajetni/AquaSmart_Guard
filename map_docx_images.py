import docx
import zipfile
import xml.etree.ElementTree as ET

docx_path = r"C:\Users\seaza\Downloads\AquaSmart_Guard.docx"
doc = docx.Document(docx_path)

with zipfile.ZipFile(docx_path, "r") as z:
    rels_xml = z.read("word/_rels/document.xml.rels")
    tree = ET.fromstring(rels_xml)
    rel_map = {}
    for rel in tree:
        r_id = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        rel_map[r_id] = target

with open(r"D:\aquarium-dashboard\docx_images_map.txt", "w", encoding="utf-8") as out:
    for i, p in enumerate(doc.paragraphs):
        # find blip
        blips = p._p.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip')
        if blips:
            for b in blips:
                embed = b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
                target = rel_map.get(embed, "unknown")
                out.write(f"Paragraph {i} has image: {embed} -> {target} | Text before: '{p.text}'\n")

print("Done docx_images_map.txt")
