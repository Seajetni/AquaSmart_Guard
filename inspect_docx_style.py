import docx

doc = docx.Document(r"C:\Users\seaza\Downloads\AquaSmart_Guard.docx")

with open(r"D:\aquarium-dashboard\docx_style_details.txt", "w", encoding="utf-8") as out:
    out.write("Document Sections:\n")
    for s in doc.sections:
        out.write(f"Page size: {s.page_width.pt} x {s.page_height.pt} pt (A4)\n")
        out.write(f"Margins (L, R, T, B): {s.left_margin.pt}, {s.right_margin.pt}, {s.top_margin.pt}, {s.bottom_margin.pt} pt\n")

    out.write("\nSample Paragraph Runs Formatting:\n")
    for i in range(len(doc.paragraphs)):
        p = doc.paragraphs[i]
        if not p.text.strip():
            continue
        runs_info = []
        for r in p.runs:
            font_name = r.font.name
            size = r.font.size.pt if r.font.size else None
            bold = r.bold
            # check r.element rPr for w:rFonts
            rFonts = r._r.get_or_add_rPr().find(docx.oxml.ns.qn('w:rFonts'))
            ascii_f = rFonts.attrib.get(docx.oxml.ns.qn('w:ascii')) if rFonts is not None else None
            eastAsia_f = rFonts.attrib.get(docx.oxml.ns.qn('w:eastAsia')) if rFonts is not None else None
            cs_f = rFonts.attrib.get(docx.oxml.ns.qn('w:cs')) if rFonts is not None else None
            runs_info.append(f"'{r.text[:30]}' [font={font_name}, ascii={ascii_f}, cs={cs_f}, size={size}, bold={bold}]")
        out.write(f"P[{i}] (Style={p.style.name if p.style else 'None'}): {' | '.join(runs_info)}\n")

print("Done writing docx_style_details.txt")
