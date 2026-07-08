import { useMemo } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Alignment,
  Autoformat,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontSize,
  Heading,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  Italic,
  Link,
  List,
  Paragraph,
  Table,
  TableToolbar,
  Underline,
  type EditorConfig,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import './RichTextEditor.css'

type Props = {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

/**
 * CKEditor 5(Classic) 래퍼.
 * - `Base64UploadAdapter` 를 물려서 업로드/붙여넣기/드롭한 이미지는 별도 서버 저장 없이
 *   base64 data URL 로 인코딩되어 본문 HTML 안에 그대로 인라인된다.
 * - `getData()` 결과(완성 HTML)를 그대로 상위로 올려준다.
 */
export default function RichTextEditor({ value, onChange, disabled }: Props) {
  const config = useMemo<EditorConfig>(
    () => ({
      // GPL(오픈소스) 라이선스로 사용
      licenseKey: 'GPL',
      plugins: [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Underline,
        Link,
        List,
        BlockQuote,
        Alignment,
        FontSize,
        FontColor,
        FontBackgroundColor,
        Indent,
        Autoformat,
        Image,
        ImageToolbar,
        ImageCaption,
        ImageStyle,
        ImageResize,
        ImageUpload,
        ImageInsert,
        Base64UploadAdapter,
        Table,
        TableToolbar,
      ],
      toolbar: [
        'undo',
        'redo',
        '|',
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'fontSize',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'alignment',
        'bulletedList',
        'numberedList',
        'outdent',
        'indent',
        '|',
        'link',
        'insertImage',
        'insertTable',
        'blockQuote',
      ],
      image: {
        toolbar: [
          'imageStyle:inline',
          'imageStyle:block',
          'imageStyle:side',
          '|',
          'imageTextAlternative',
          'toggleImageCaption',
        ],
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
      },
      placeholder: '매뉴얼 내용을 입력하세요. 이미지는 붙여넣거나 이미지 버튼으로 추가할 수 있습니다.',
    }),
    [],
  )

  return (
    <div className="rich-text-editor">
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value}
        disabled={disabled}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  )
}
