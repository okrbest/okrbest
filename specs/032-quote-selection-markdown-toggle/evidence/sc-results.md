# SC 실측 (T035)

| SC | 기준 | 실측 | 판정 | 증거 |
|---|---|---|---|---|
| SC-001 | 인용해 답하는 데 선택 1번 + 클릭 1번 | 드래그 선택 1번 → 인용 버튼 클릭 1번 → 입력창에 인용 블록, 커서는 아래 빈 줄. 직접 복사·붙여넣기·`> ` 입력 0번 | 충족 | [us1.md](us1.md) 시나리오 1 |
| SC-002 | 인용 7경우 모두 전송 메시지 = upstream 인용 결과(끝 공백·끝 빈 줄 제외) | 단위: `append_quote.test.ts`가 `appendQuoteToMessage`와 비교 7/7 통과(단문, 빈 줄 낀 문단, 목록, 코드 펜스, 서식·링크, 멘션·채널, 기존 글). 실주행: 시나리오 1(단문+멘션+굵게) 글자 단위 일치, 시나리오 2(문단·목록·코드·기존 글) 끝 공백 제외 일치 | 충족 (7/7) | [us1-green.md](us1-green.md), [us1.md](us1.md) |
| SC-003 | upstream 두 커밋 단위 테스트 통과. 예외는 TipTap 전용, 재생성 스냅샷 | caaec8cd: 5스위트 131건 통과(원형). `use_pending_quote` 3건 원형 통과(+포크 3건). `advanced_text_editor` 인용 3건은 Lexical 기준으로 옮겨 통과. 36ebc1f6: 16스위트 179건 통과. 예외: `wysiwyg_editor_interactions.test.tsx`(TipTap, 버림), 헤더·내비 스냅샷 3건(재생성) | 충족 | [us1-apply.md](us1-apply.md), [us2.md](us2.md), [us4.md](us4.md) |
| SC-004 | 06ab8d2c 반영 때 뺀 테스트 8건 + 코드 블록 Markdown 묶음 되살아나 통과 | `components/CodePreview markdown files` 8건, `code_block.test.tsx` `markdown code blocks`(`ToggleableCodeBlock`) 통과 | 충족 | [toggle-apply.md](toggle-apply.md), [us3.md](us3.md) |
| SC-005 | 채널·RHS·팝아웃 입력창에 인용 블록, 커서 아래 | 채널 입력창, RHS 스레드 답글창, 스레드 팝아웃, 채널 팝아웃 4곳 모두 인용 블록 1개(실제 브라우저) | 충족 (4/4) | [us1.md](us1.md) 시나리오 1·3 |
| SC-006 | .md 미리보기·Markdown 코드 블록에서 전환·기억·원문 복사 | 시나리오 5 9/9, 시나리오 6 11/11(전환, 새로고침 후 유지, 위치별 기억, 원문 복사, 고정 상자, 모바일 원문) | 충족 | [us2.md](us2.md), [us3.md](us3.md) |
| SC-007 | 포크 파일 미리보기 회귀 0건, 게이트 실패 목록이 기준선보다 늘지 않음 | 게이트 6개 목록 diff 0. 바깥 클릭 닫기·휠 확대 PASS(라이트·다크). 키보드 확대·확대 후 끌기는 실주행에서 FAIL이지만 master 번들에서도 같아 회귀 0건 | 충족 | [final-gates.md](final-gates.md), [us4.md](us4.md) |
