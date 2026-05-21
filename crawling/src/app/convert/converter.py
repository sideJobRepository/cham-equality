from pathlib import Path

from hwp5.hwp5html import HTMLTransform
from hwp5.xmlmodel import Hwp5File

from app.core.paths import GENERATED, RESOURCES


def hwp_to_html(hwp_path: Path, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    hwp5file = Hwp5File(str(hwp_path))

    try:
        transform = HTMLTransform()
        transform.transform_hwp5_to_dir(hwp5file, str(output_dir))
    finally:
        hwp5file.close()


if __name__ == '__main__':
    hwp_to_html(RESOURCES / 'test2.hwp', GENERATED / 'convert')
