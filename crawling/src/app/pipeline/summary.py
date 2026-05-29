from google.genai import types, errors
from google import genai
from app.core.config import settings
from app.core.exceptions import GeminiApiError
from app.core.paths import GENERATED, RESOURCES
from app.pipeline.schemas import RefineResult, SummaryResult


GEMINI_MODEL = settings.gemini_model

client = genai.Client(api_key=settings.gemini_api_key)

def extract(refine_result: RefineResult) -> SummaryResult:    

    try:
        summary =  _query_llm_summary_report(refine_result.refined_html)
        return SummaryResult(refine_result=refine_result, summary=summary)
    except errors.APIError as e:
        raise GeminiApiError(e.code, e.message) from e


def _query_llm_summary_report(html_content: str) -> str:

    prompt = f"""
    # 작업 개요
    제공된 HTML 문서에서 "Ⅱ. 재난안전 활동상황" 섹션에 해당하는 내용만 찾아서, 모바일 앱 카드의 제목이나 한 줄 피드에 바로 넣을 수 있도록 명확하고 직관적인 '한 줄 요약' 리스트를 JSON 배열 형식으로 추출해줘.

    # 조건 및 제약사항
    1. 범위 제한
    - "Ⅱ. 재난안전 활동상황" 이하에 등장하는 재난 관련 항목만 추출하라. 다른 섹션은 모두 무시하라.
    - 화재 및 구조 구급 현황: 화재건수,사망자 수, 부상자 수, 피해액, 구조인원, 구조조치인원, 구급인원, 구급조치인원 정보
    - 나머지: '재난' 관련해서 '일반 시민' 이 알아야 할 정보. 대책회의나 단말기 교신 점검같은 일상적인 업무수행은 필요없음

    2. 한 줄 요약 규칙:    
    - 각 카드에 들어갈 텍스트는 30자~50자 내외의 '한 줄 문장' 또는 '명확한 구절'을 '개조식' 으로 작성.
    - 문장 앞에 불필요한 기호(○, □, -, 1.) 및 무의미한 공백은 모두 제거하라.
    - 단순 제목이 아니라 '무엇을 했는지' 또는 '어떤 일이 있었는지' 핵심 행동/결과가 한눈에 보여야 한다.
    - 예: "○ 여름철 대비 식중독 대책협의기구 실무협의회" -> "여름철 대비 식중독 예방·관리 추진대책 수립 실무협의회 개최"

    3. 언어: 모든 텍스트는 한국어로 출력하라.

    # 출력 포맷
    반드시 마크다운 코드 블록 없이 순수한 JSON 배열 형식으로만 응답해야 해. 구조는 다음과 같아야 해:
    [
    "첫 번째 카드에 들어갈 한 줄 핵심 요약 문구",
    "두 번째 카드에 들어갈 한 줄 핵심 요약 문구",
    ...
    ]

    # 입력 HTML
    {html_content}
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[prompt],
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=list[str]
        )
    )

    return response.text


if __name__ == '__main__':
    html = """
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xml:lang="ko" lang="ko">
	<head>
		<meta content="text/html; charset=UTF-8" http-equiv="content-type" />
		<meta content="Synap Document Viewer 2022(v25.04.5)" name="GENERATOR" />
		
		<title>b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b</title>
		
		
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/jquery-3.7.0.min.js"></script>
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/spin.min.js"></script><script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/config.js"></script>
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/common.js"></script>
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/browser_check.js"></script>
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/wm.js"></script>
		<script type="text/javascript" src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/word_body.js"></script>

		<script>var jsValue = ""; </script>
	</head>
	<body tabindex="0">
		
			<div id="content_body"><div id="div_page"><div><p><table summary="table" id="1"><colgroup><col /><col /><col /><col /></colgroup><tr><td><p><span> </span></p></td><td><p><span> </span></p></td><td colspan="2"><p><span> </span></p></td></tr><tr><td rowspan="2"><p><img src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/image1_effect.png" owidth="63.9pt" oheight="63.2pt" alt="그림입니다. 원본 그림의 이름: 사본 -img_emblem_new.png 원본 그림의 크기: 가로 243pixel, 세로 240pixel 사진 찍은 날짜: 2022년 07월 01일 오후 8:45" /></p></td><td colspan="2"><p><span>일일 재난안전관리 상황</span></p></td><td rowspan="2"><p><img src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/image2_effect.png" owidth="28.3pt" oheight="28.3pt" /></p><p><span>재난안전상황실</span></p><p><span> </span></p></td></tr><tr><td colspan="2" valign="top"><p><span>2026. 5. 29.(금) 06:00 </span></p></td></tr><tr><td colspan="4"><p><span> </span></p></td></tr><tr><td colspan="4"><p><span> </span><span>Ⅰ. 기상·대기 상황</span><span>   </span></p></td></tr><tr><td colspan="4" valign="top"><div><p><table summary="table" id="2"><colgroup><col /><col /><col /><col /><col /><col /><col /></colgroup><tr><td><p><span>구</span><span> </span><span>분</span></p></td><td><p><span>일</span><span> </span><span>자</span></p></td><td colspan="2"><p><span>기 </span><span> </span><span>상</span><span> </span><span> 전</span><span> </span><span> 망</span></p></td><td><p><span>기온(℃)</span></p></td><td><p><span>풍속(m/s)</span></p></td><td><p><span>기상특보</span></p></td></tr><tr><td><p><span>오늘</span></p></td><td><p><span>5. 29.(금)</span></p></td><td colspan="2"><p><span> 대체로 맑음</span></p></td><td><p><span>15 / 26</span></p></td><td><p><span>1 ~ 3</span></p></td><td rowspan="3"><p><span> </span></p></td></tr><tr><td><p><span>내일 </span></p></td><td><p><span>5. 30.(토)</span></p></td><td colspan="2"><p><span> 대체로 맑음</span></p></td><td><p><span>13 / 28</span></p></td><td><p><span>1 ~ 3</span></p></td></tr><tr><td><p><span>모레</span></p></td><td><p><span>5. 31.(일)</span></p></td><td colspan="2"><p><span> 대체로 맑다가 밤에 구름 많음</span></p></td><td><p><span>14 / 30</span></p></td><td><p><span>1 ~ 2</span></p></td></tr><tr><td><p><span>대기질</span></p></td><td colspan="2"><p><span>미세먼지(PM-10): 보통(일평균 41㎍/㎥)</span></p></td><td colspan="4"><p><span>초미세먼지(PM-2.5): 보통(일평균 23㎍/㎥)</span></p></td></tr></table><span> </span></p></div></td></tr><tr><td colspan="4" valign="top"><p><span> </span><span>Ⅱ. 재난안전 활동상황</span></p></td></tr><tr><td colspan="4" valign="top"><p><span>  </span></p><p><span>  </span><span>□</span><span> </span><span>화재 및</span><span> </span><span>구조·구급 현황</span></p><p><span> </span><table summary="table" id="3"><colgroup><col /><col /><col /><col /><col /><col /><col /><col /><col /></colgroup><tr><td rowspan="2"><p><span>구 분</span></p></td><td colspan="4"><p><span>화 재</span></p></td><td colspan="2"><p><span>구 조</span></p></td><td colspan="2"><p><span>구 급</span></p></td></tr><tr><td><p><span>건수</span></p></td><td><p><span>사망</span></p></td><td><p><span>부상</span></p></td><td><p><span>피해액</span><span>(만원)</span></p></td><td><p><span>조치</span></p></td><td><p><span>인원</span></p></td><td><p><span>이송</span></p></td><td><p><span>인원</span></p></td></tr><tr><td><p><span>일계</span></p></td><td><p><span>1</span></p></td><td><p><span>-</span></p></td><td><p><span>-</span></p></td><td><p><span>13</span></p></td><td><p><span>11</span></p></td><td><p><span>11</span></p></td><td><p><span>106</span></p></td><td><p><span>105</span></p></td></tr></table></p></td></tr><tr><td colspan="4"><p><span>  </span><span>○</span><span> </span><span>화재 및 구조·구급 내용</span></p><p><span>     </span><span>1. 화재(업무시설) 5. 28.(목) 16:21(접수시간) 중구 계백로</span><span> </span><span>(오류동)</span></p><p><span>      </span><span>- 오피스텔 지하 5층 창고에서 미상인의 라이터 사용 부주의로 인해 발생한 화재</span></p><p><span>  </span><span>○ </span><span>여름철 대비 식중독 대책협의기구 실무협의회</span></p><p><span>     </span><span>- </span><span>일시</span><span>/</span><span>주재</span><span>: 5. 28.(목) 14:00 / 식품의약품안전처 식품안전정책국장</span></p><p><span>     </span><span>- 참석기관: 식약처 등 11개 중앙부처 및 17개 시‧도, 유관기관(6)</span></p><p><span>     </span><span>- 회의내용: 여름철 식중독 예방·관리 추진대책 수립 및 논의</span></p><p><span>  </span><span>○</span><span> </span><span>재난안전통신망(PS-LTE) 단말기 교신 점검</span></p><p><span>     </span><span>- 점검일시: 5. 28.(목)15:00</span></p><p><span>     </span><span>- 대상기관: 대전경찰청 상황실 등 19개소</span></p><p><span>  </span><span>○ </span><span>여름철 수상 안전 관계기관 대책회의</span></p><p><span>     </span><span>- </span><span>일시</span><span>/</span><span>주재</span><span>: 5. 28.(목) 16:00 / 행정안전부 재난안전관리본부장</span></p><p><span>     </span><span>- 참석기관: 행안부 등 8개 중앙부처 및 17개 시‧도 및 공사‧공단(2)</span></p><p><span>     </span><span>- 회의내용: 기관별 대책 보고 및 대통령 지시사항 이행 방안 등 주요 현안 논의</span><span>  </span></p><p><span>  </span><span>○</span><span> </span><span>상황전파(NDMS) 수·발신 및 전파 현황</span></p><p><span>     </span><span>- 상황수신: 20건(화재출동 13, 재난예방 4, 훈련 2, 기타 1)</span></p><p><span>     </span><span>- 상황전파: 4건(재난예방 4)</span></p></td></tr><tr><td colspan="4"><p><span> </span><span>Ⅲ. 재난관련 중앙부처 동향 및 지역 언론</span></p></td></tr><tr><td colspan="4" valign="top"><div><p><table summary="table" id="4"><colgroup><col /><col /></colgroup><tr><td><p><span>중앙부처 동향</span></p></td><td><p><span>지역 주요 언론보도</span></p></td></tr><tr><td valign="top"><p><span> </span><span>□</span><span> </span><span>(</span><span>행안부</span><span>)</span><span>화재</span><span>·</span><span>교통</span><span>·</span><span>선박</span><span>·</span><span>사업장</span><span> </span><span>사고 등 최근</span><span> </span><span>사례</span></p><p><span>   </span><span>전파 및 상황관리</span><span> </span><span>철저</span><span>, </span><span>국민행동요령 안내</span><span>(NDMS)</span></p></td><td valign="top"><p><span> </span><span>□ </span><span>대전시</span><span>, </span><span>시민 전원 ‘자전거 보험’ 자동 가입 완료</span></p><p><span> </span><span>  </span><span>자전거</span><span>·PM </span><span>사고 전면 보장</span><span>(</span><span>충청매일</span><span>·</span><span>충남일보</span><span>)</span></p></td></tr></table></p></div></td></tr><tr><td colspan="4"><p><img src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/image3.bmp_effect.png" owidth="24.5pt" oheight="23.1pt" alt="그림입니다. 원본 그림의 이름: noname01.bmp 원본 그림의 크기: 가로 55pixel, 세로 52pixel" /><span>안전한 대전! 행복한 시민!</span><span> </span><span>                                      </span><span> </span><img src="b54872109057f6878d0da2e02466e62f_0f80f3221e6644c3c54cf486c776122b.files/image4.bmp_effect.png" owidth="90.8pt" oheight="22.2pt" alt="그림입니다. 원본 그림의 이름: CLP0000017869ed.bmp 원본 그림의 크기: 가로 672pixel, 세로 185pixel" /></p></td></tr></table></p><div id="caption_1"><p><span> </span></p></div></div></div></div>
			<div id="hidden_section"></div>

	</body>
</html>

    """
    
    summarized = _query_llm_summary_report(html)
    print(summarized)
