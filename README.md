# FFXIVKR_GLAMOUR_TRANSLATOR

EORZEACOLLECTION과 MIRAPRI의 아이템명을 한국서버의 번역명으로 표시하고, 타르토맛 타르트 검색 결과/아이템 페이지로 이어지는 버튼을 생성하는 Chrome 확장 프로그램입니다.

## 주요 기능

- Eorzea Collection 글램 페이지의 장비명을 한국 서버 번역명으로 표시
- MIRAPRI 글램 페이지의 일본어 장비명을 한국 서버 번역명으로 표시
- 염료명 번역 표시
- 표시된 번역명 클릭 시 `ff14.tar.to`의 검색 결과 또는 아이템 페이지로 이동
- `Featured in Album`, `Seasonal Item`, `Optional` 등 장비/염료가 아닌 항목은 번역 대상에서 제외

## 지원 사이트

- `https://ffxiv.eorzeacollection.com/glamour/*`
- `https://mirapri.com/*`
- `https://www.mirapri.com/*`

## 사용 권한

이 확장 프로그램은 별도의 Chrome API 권한을 요청하지 않습니다.

`host_permissions`는 타르토맛 타르트에서 아이템/염료 검색 결과를 가져오기 위해 아래 도메인에만 사용됩니다.

```json
"host_permissions": [
  "https://ff14.tar.to/*"
]
```

## 로컬 설치 방법

1. 이 저장소를 다운로드하거나 클론합니다.
2. Chrome 주소창에 `chrome://extensions` 입력
3. 우측 상단 **개발자 모드** 활성화
4. **압축해제된 확장 프로그램 로드** 클릭
5. 이 저장소 폴더를 선택합니다.

## Chrome Web Store 제출용 ZIP

Chrome Web Store에는 저장소 전체가 아니라 확장 소스 파일만 들어 있는 ZIP을 업로드해야 합니다.

제출용 파일은 다음 위치에 포함되어 있습니다.

```txt
store/FFXIV_ITEM_TRANSLATOR_V1.zip
```

## 개인정보 처리

이 확장 프로그램은 사용자의 개인정보를 수집, 저장, 판매하지 않습니다. 자세한 내용은 [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md)를 확인하세요.

## Disclaimer

이 프로젝트는 FINAL FANTASY XIV, Eorzea Collection, MIRAPRI, 타르토맛 타르트와 공식적으로 제휴되어 있지 않습니다.
FINAL FANTASY XIV 관련 상표와 저작권은 각 권리자에게 있습니다.
## Icon

Extension icon uses `icons/transpose.png`, based on the FFXIV BLM Transpose icon file specified by the project owner.

