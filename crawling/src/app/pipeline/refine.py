from pathlib import Path
from lxml import etree

from app.core.paths import GENERATED


def refine(html_path: Path, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    tree = etree.parse(html_path)
    root = tree.getroot()

    ns = {'x': 'http://www.w3.org/1999/xhtml'}

    for elem in root.iter():
        elem.attrib.pop('style', None)
        elem.attrib.pop('class', None)

    for style in root.findall('.//x:style', ns):
        style.getparent().remove(style)

    for link in root.findall('.//x:link', ns):
        if link.get('rel') == 'stylesheet':
            link.getparent().remove(link)

    tree.write(str(output_path), pretty_print=True, encoding='utf-8')


if __name__ == '__main__':
    refine(GENERATED / 'crawling' / 'ok.html', GENERATED / 'refine' / 'refined2.html')
