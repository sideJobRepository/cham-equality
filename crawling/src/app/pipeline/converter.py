from pathlib import Path
import tempfile
import shutil

from hwp5.hwp5html import HTMLTransform
from hwp5.xmlmodel import Hwp5File
from app.core.paths import GENERATED, RESOURCES


def hwp_to_html(hwp_path: Path, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)

    hwp5file = Hwp5File(str(hwp_path))

    try:
        transform = HTMLTransform()

        with tempfile.TemporaryDirectory() as temp_dir:
            transform.transform_hwp5_to_dir(hwp5file, str(temp_dir))
            html_path = Path(temp_dir) / 'index.xhtml'
            shutil.move(html_path, output_path)                       

    finally:
        hwp5file.close()   


if __name__ == '__main__':
    hwp_to_html(RESOURCES / 'test3.hwpx', GENERATED / 'convert' / 'index.xhtml')
