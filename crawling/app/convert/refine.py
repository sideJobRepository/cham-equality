from pathlib import Path
from lxml import etree


def refine(html_path: Path, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    tree = etree.parse(html_path)
    root = tree.getroot()

    # 네임스페이스 처리
    ns = {'x': 'http://www.w3.org/1999/xhtml'}

    # style 속성 제거
    for elem in root.iter():
        elem.attrib.pop('style', None)
        elem.attrib.pop('class', None)

    # <style> 태그 제거
    for style in root.findall('.//x:style', ns):
        style.getparent().remove(style)

    # <link rel="stylesheet"> 제거
    for link in root.findall('.//x:link', ns):
        if link.get('rel') == 'stylesheet':
            link.getparent().remove(link)

    tree.write(str(output_path), pretty_print=True, encoding='utf-8')


if __name__ == '__main__':
    project_root = Path('/Users/sjk/Documents/git/cham-equality/crawling') # tmp
    html_path = project_root / 'generated' / 'convert' / 'index.xhtml'
    output_path = project_root / 'generated' / 'refine' / 'refined.html'
    refine(html_path, output_path)
