# Phase 0 Research: 조직/직위 관리 다중 선택 · 일괄 지정 · 일괄 저장

Technical Context에 `NEEDS CLARIFICATION`으로 남은 항목은 없다. 아래는 계획 단계에서 확정한 기술 결정과 근거를 기록한다(전부 사전 코드 탐색 및 사용자 확인을 거쳐 확정됨).

## 1. 프론트엔드 전용 1차 구현 vs 서버 배치 API 신설

- **Decision**: 이번 기능은 프론트엔드에서 기존 단건 `PUT /api/v4/teams/{team_id}/users/{user_id}/org-profile`를 Dirty 사용자마다 순차 호출하는 방식으로 구현한다. 서버 배치 엔드포인트는 신설하지 않는다.
- **Rationale**: 서버 `UpsertUserOrgProfile`(`server/channels/app/org_role.go`) 호출마다 `GetUser` 조회, 팀 전체 `ListPositionDefinitions` 조회, `PatchUser` 쓰기(웹소켓 브로드캐스트 포함), 감사로그 insert가 발생한다. 이는 단순 단건 upsert보다 무거우며, 병렬 호출 시 동일 팀에 대한 동시 `PatchUser`/브로드캐스트가 몰릴 수 있다. 순차 호출은 이 부하를 자연스럽게 제한하고, 감사로그·이벤트 순서를 화면 상 처리 순서와 일치시켜 디버깅을 쉽게 한다. 사용자 간 데이터 경합(교차 사용자 레이스 컨디션)은 없음을 확인했다(각 호출이 URL의 `team_id`/`user_id`로 스코프됨).
- **Alternatives considered**:
  - `Promise.all` 병렬 호출 — 더 빠르지만 동시 서버 부하·이벤트 순서 비결정성이 커짐. 기각.
  - 서버 배치 API 신설(`POST /teams/{team_id}/org-profiles/batch`, `MaxAddMembersBatch=256` 패턴 참고) — 대규모 팀 성능 문제가 실제로 확인되면 도입할 후속 과제로 남김. 이번 스펙 범위(assumptions에 명시) 밖.

## 2. 상태 관리 및 API 호출 패턴

- **Decision**: 기존 컴포넌트의 로컬 `fetch` 기반 `request<T>()` 헬퍼와 React `useState`/`useMemo` 패턴을 그대로 확장한다. Client4/redux로 전환하지 않는다.
- **Rationale**: `org_role_management_body.tsx`는 처음부터 Client4/redux를 쓰지 않는 독립 영역이며, 공유 모델 파일도 없다. 이번 기능만 Client4로 전환하면 파일 내 두 가지 데이터 접근 패턴이 공존해 일관성이 깨진다. 범위를 좁게 유지하는 것이 constitution 원칙 VI(집중 PR)과도 부합한다.
- **Alternatives considered**: Client4 메서드 + redux action/selector 신설 — 더 표준적이지만 이번 기능의 범위를 크게 벗어나는 리팩터링이라 기각.

## 3. 전체 선택 범위 및 선택 상태 유지 정책

- **Decision**: 헤더 "전체 선택"은 현재 `filteredUsers`(필터/검색 적용 결과)만 대상으로 하고, 선택 상태(`selectedUserIds`)는 필터가 바뀌어도 유지된다.
- **Rationale**: 사용자에게 직접 확인한 결정(대화 내 AskUserQuestion). 필터 결과만 전체 선택하는 것이 대규모 팀에서 의도치 않은 대량 변경을 방지하며, 선택 유지는 "내가 선택한 사람들"이라는 사용자의 기대와 일치한다.
- **Alternatives considered**: 전체 팀원 대상 전체 선택(필터 무관) — 의도치 않은 대량 편집 위험으로 기각. 필터에서 사라지면 선택 해제 — 실수로 선택이 풀릴 위험이 있어 기각.

## 4. 일괄 지정 툴바의 "미지정" 처리

- **Decision**: 일괄 지정 툴바는 값 설정 전용이며, 부서/직위를 "미지정"으로 일괄 초기화하는 기능은 제공하지 않는다. 빈 값(no-op)은 "이 필드는 변경하지 않음"을 의미하며, 행별 select의 빈 값("미지정")과는 다른 의미로 별도 라벨(`부서 변경 안함`/`직위 변경 안함`)을 사용한다.
- **Rationale**: 사용자에게 직접 확인한 결정. 동일한 빈 문자열이 "변경 안 함"과 "미지정으로 설정"을 동시에 의미할 수 없으므로, 이번 범위에서는 전자만 지원해 모호성을 제거한다.
- **Alternatives considered**: 별도의 "미지정으로 일괄 설정" 옵션 추가 — UI/테스트 범위가 늘어나고 이번 확정 요구사항에는 없으므로 기각(후속 과제로 열어둠).

## 5. 저장 실패 처리 및 요약 메시지 자동 숨김 정책

- **Decision**: 부분 실패 시 성공/실패 건수 요약 메시지를 표시하고, 실패가 있으면 자동으로 숨기지 않는다. 실패가 없으면 기존 `SUCCESS_MESSAGE_DURATION_MS`(2500ms)와 동일하게 자동 숨김한다.
- **Rationale**: 실패 정보는 사용자가 재시도 대상을 파악할 시간이 필요하므로 조기 소멸시키지 않는 것이 안전하다. 성공만 있는 경우는 기존 단건 저장 UX와 동일하게 유지해 회귀 요구사항(spec SC-005)을 만족한다.
- **Alternatives considered**: 항상 자동 숨김 — 실패 건 확인 전에 메시지가 사라질 위험. 항상 수동 닫기 — 매번 성공한 경우에도 사용자가 닫아야 해서 기존 UX보다 번거로워짐. 둘 다 기각.

## 6. i18n 문자열 처리

- **Decision**: 이번 변경이 수정하는 두 파일 — `org_role_management_body.tsx`(기존 `FormattedMessage` 0건, 인라인 한글 리터럴 약 63건)와 `org_role_management.tsx`(일부 이미 `FormattedMessage` 사용 중, 잔여 리터럴 약 6건) — 의 사용자 노출 문자열을 **신규 문자열뿐 아니라 기존 리터럴까지 전부** `react-intl`의 `FormattedMessage`/`defineMessage`로 전환해 `admin.org_role_management.*` id를 부여하고, `webapp/channels/src/i18n/en.json`·`ko.json`에 같은 변경에서 동시 추가한다. 이 디렉터리 밖의 다른 admin_console 컴포넌트는 이번 범위에 포함하지 않는다.
- **Rationale**: Constitution 원칙 V("사용자에게 표시되는 문자열을 추가·변경하면 en.json과 ko.json을 같은 변경에서 동시 갱신한다")를 그대로 준수한다. 결정은 두 차례 조정되었다: 최초에는 "기존 파일 관례(인라인 리터럴) 유지"였고, 1차 피드백으로 "신규 문자열만 카탈로그화"로 바뀌었으며, 2차 피드백("이번에 수정하는 김에 같이 수정")으로 **이번에 어차피 수정하는 두 파일 전체의 문자열을 함께 정리**하는 것으로 최종 확정했다. 같은 파일을 이미 편집하는 상황에서 리터럴과 카탈로그 방식이 한 파일 안에 공존하는 것을 피할 수 있어, 결과적으로 유지보수성도 더 낫다. id 네이밍은 같은 admin_console 계열 컴포넌트(`team_settings.tsx` 등)에서 쓰는 `admin.<feature>.<key>` 패턴을 따른다. `npm run i18n-extract`(mmjstool) 실행으로 `en.json` 항목을 추출하고 `ko.json`에는 대응하는 한국어 번역을 수동으로 채운다.
- **Alternatives considered**: 기존 인라인 리터럴 패턴 유지(최초 결정) — 원칙 V를 명시적으로 위반해 기각. 신규 문자열만 카탈로그화(1차 결정) — 한 파일 안에 두 방식이 공존해 사용자가 "이번에 같이 정리하자"고 재조정, 최종안으로 대체됨. `org_role_management` 디렉터리 밖 다른 컴포넌트까지 포함한 전사적 마이그레이션 — 이번 기능이 손대지 않는 파일까지 끌어들여 범위를 크게 벗어나므로 기각(후속 과제).
