from lxml import etree

from app.pipeline.schemas import CrawlResult, RefineResult


def refine(crawl_result: CrawlResult) -> RefineResult:
    root = etree.fromstring(crawl_result.html_content.encode('utf-8'))

    ns = {'x': 'http://www.w3.org/1999/xhtml'}

    for elem in root.iter():
        elem.attrib.pop('style', None)
        elem.attrib.pop('class', None)

    for style in root.findall('.//x:style', ns):
        style.getparent().remove(style)

    for link in root.findall('.//x:link', ns):
        if link.get('rel') == 'stylesheet':
            link.getparent().remove(link)

    refined_html = etree.tostring(root, pretty_print=True, encoding='utf-8').decode('utf-8')

    return RefineResult(crawl_result=crawl_result, refined_html=refined_html)
