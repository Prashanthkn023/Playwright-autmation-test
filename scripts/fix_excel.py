import zipfile
import os
import xml.etree.ElementTree as ET
import xml.sax.saxutils as saxutils

def escape(val):
    if val is None:
        return ""
    return saxutils.escape(str(val))

def get_col_letter(col_idx):
    """Convert 0-based column index to Excel column letter (A, B, ..., Z, AA, AB, ...)."""
    result = ""
    col_idx += 1
    while col_idx > 0:
        col_idx, remainder = divmod(col_idx - 1, 26)
        result = chr(65 + remainder) + result
    return result

class OpenXMLXlsxBuilder:
    def __init__(self, filename):
        self.filename = filename
        self.sheets = []
        self.shared_strings = []
        self.string_map = {}

    def add_sheet(self, title, headers, rows):
        self.sheets.append((title, headers, rows))

    def _add_string(self, s):
        if s is None:
            s = ""
        s = str(s)
        if s in self.string_map:
            return self.string_map[s]
        idx = len(self.shared_strings)
        self.shared_strings.append(s)
        self.string_map[s] = idx
        return idx

    def build(self):
        os.makedirs(os.path.dirname(os.path.abspath(self.filename)), exist_ok=True)

        # First pass: collect all strings
        for _, headers, rows in self.sheets:
            for h in headers:
                self._add_string(h)
            for r in rows:
                for val in r:
                    if not isinstance(val, (int, float)) or isinstance(val, bool):
                        self._add_string(val)

        with zipfile.ZipFile(self.filename, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            # 1. [Content_Types].xml
            ct = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
            ct.append('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">')
            ct.append('  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>')
            ct.append('  <Default Extension="xml" ContentType="application/xml"/>')
            ct.append('  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.workbook+xml"/>')
            ct.append('  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>')
            ct.append('  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>')
            for i in range(len(self.sheets)):
                ct.append(f'  <Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
            ct.append('</Types>')
            zip_ref.writestr('[Content_Types].xml', '\n'.join(ct))

            # 2. _rels/.rels
            rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
            rels.append('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')
            rels.append('  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>')
            rels.append('</Relationships>')
            zip_ref.writestr('_rels/.rels', '\n'.join(rels))

            # 3. xl/_rels/workbook.xml.rels
            w_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
            w_rels.append('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')
            for i in range(len(self.sheets)):
                w_rels.append(f'  <Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>')
            style_r_id = len(self.sheets) + 1
            shared_r_id = len(self.sheets) + 2
            w_rels.append(f'  <Relationship Id="rId{style_r_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>')
            w_rels.append(f'  <Relationship Id="rId{shared_r_id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>')
            w_rels.append('</Relationships>')
            zip_ref.writestr('xl/_rels/workbook.xml.rels', '\n'.join(w_rels))

            # 4. xl/workbook.xml
            wb_xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
            wb_xml.append('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
            wb_xml.append('  <sheets>')
            for i, (title, _, _) in enumerate(self.sheets):
                wb_xml.append(f'    <sheet name="{escape(title)}" sheetId="{i+1}" r:id="rId{i+1}"/>')
            wb_xml.append('  </sheets>')
            wb_xml.append('</workbook>')
            zip_ref.writestr('xl/workbook.xml', '\n'.join(wb_xml))

            # 5. xl/styles.xml
            styles = [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
                '  <fonts count="3">',
                '    <font><sz val="11"/><name val="Segoe UI"/></font>',
                '    <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FFFFFF"/></font>',
                '    <font><b/><sz val="12"/><name val="Segoe UI"/></font>',
                '  </fonts>',
                '  <fills count="3">',
                '    <fill><patternFill patternType="none"/></fill>',
                '    <fill><patternFill patternType="gray125"/></fill>',
                '    <fill><patternFill patternType="solid"><fgColor rgb="1B365D"/><bgColor rgb="1B365D"/></patternFill></fill>',
                '  </fills>',
                '  <borders count="2">',
                '    <border><left/><right/><top/><bottom/></border>',
                '    <border>',
                '      <left style="thin"><color rgb="D3D3D3"/></left>',
                '      <right style="thin"><color rgb="D3D3D3"/></right>',
                '      <top style="thin"><color rgb="D3D3D3"/></top>',
                '      <bottom style="thin"><color rgb="D3D3D3"/></bottom>',
                '    </border>',
                '  </borders>',
                '  <cellStyleXfs count="1">',
                '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>',
                '  </cellStyleXfs>',
                '  <cellXfs count="3">',
                '    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
                '    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>',
                '    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>',
                '  </cellXfs>',
                '</styleSheet>'
            ]
            zip_ref.writestr('xl/styles.xml', '\n'.join(styles))

            # 6. xl/sharedStrings.xml
            sst = [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(self.shared_strings)}" uniqueCount="{len(self.shared_strings)}">'
            ]
            for s in self.shared_strings:
                sst.append(f'  <si><t>{escape(s)}</t></si>')
            sst.append('</sst>')
            zip_ref.writestr('xl/sharedStrings.xml', '\n'.join(sst))

            # 7. Worksheets
            for idx, (title, headers, rows) in enumerate(self.sheets):
                ws = [
                    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
                    '  <sheetViews>',
                    '    <sheetView tabSelected="1" workbookViewId="0">',
                    '      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
                    '    </sheetView>',
                    '  </sheetViews>',
                    '  <sheetData>'
                ]

                # Header Row
                ws.append(f'    <row r="1" spans="1:{len(headers)}">')
                for c_idx, h in enumerate(headers):
                    col_let = get_col_letter(c_idx)
                    s_idx = self.string_map[str(h)]
                    ws.append(f'      <c r="{col_let}1" t="s" s="1"><v>{s_idx}</v></c>')
                ws.append('    </row>')

                # Data Rows
                for r_idx, r in enumerate(rows):
                    row_num = r_idx + 2
                    ws.append(f'    <row r="{row_num}" spans="1:{len(r)}">')
                    for c_idx, val in enumerate(r):
                        col_let = get_col_letter(c_idx)
                        if isinstance(val, (int, float)) and not isinstance(val, bool):
                            ws.append(f'      <c r="{col_let}{row_num}" s="2"><v>{val}</v></c>')
                        else:
                            s_idx = self.string_map[str(val) if val is not None else ""]
                            ws.append(f'      <c r="{col_let}{row_num}" t="s" s="2"><v>{s_idx}</v></c>')
                    ws.append('    </row>')

                ws.append('  </sheetData>')

                # Add AutoFilter & Freeze Panes
                max_col_let = get_col_letter(len(headers) - 1)
                max_row = len(rows) + 1
                ws.append(f'  <autoFilter ref="A1:{max_col_let}{max_row}"/>')
                ws.append('</worksheet>')

                zip_ref.writestr(f'xl/worksheets/sheet{idx+1}.xml', '\n'.join(ws))

print("Builder defined successfully.")
