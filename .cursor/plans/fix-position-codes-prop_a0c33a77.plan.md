---
name: fix-position-codes-prop
overview: "`syncUserOrgProfileToProps`가 `position_codes`에 ID를 저장하는 문제를 코드/테스트 양쪽에서 일관되게 `Code` 기준으로 바로잡습니다."
todos:
  - id: fix-sync-position-codes-source
    content: syncUserOrgProfileToProps가 position_codes에 Code를 저장하도록 수정
    status: cancelled
  - id: update-org-profile-prop-test-expectations
    content: team_org_roles_test의 position_codes 기대값을 Code 기준으로 수정
    status: cancelled
  - id: run-targeted-org-profile-tests
    content: 관련 go test 실행 및 결과/환경 제약 보고
    status: cancelled
isProject: false
---

# Position Codes 저장 버그 수정 계획

## 검증 결과
- 버그는 실제로 존재합니다. `[server/channels/app/org_role.go](server/channels/app/org_role.go)`에서 `positionCodes` 배열에 `positionID`를 넣고 있습니다.

```388:397:server/channels/app/org_role.go
for _, positionID := range append([]string{item.PrimaryPositionID}, item.ExtraPositions...) {
	...
	seenPositions[positionID] = struct{}{}
	positionCodes = append(positionCodes, positionID)
}
```

- 같은 파일 상수는 `userPropPositionCodes = "position_codes"`이며, 주석도 boards 쪽 org context가 `position_codes`를 읽는다고 명시합니다.
- `[server/channels/api4/team_org_roles_test.go](server/channels/api4/team_org_roles_test.go)`의 현재 검증도 `position_codes == position.ID`를 기대해 잘못된 동작을 고정하고 있습니다.

## 변경 계획
- `[server/channels/app/org_role.go](server/channels/app/org_role.go)`
  - `positionID -> position.Code` 변환 맵을 `ListPositionDefinitions` 결과로 구성합니다.
  - `positionCodes`에는 ID가 아니라 코드만 저장하도록 변경합니다.
  - 중복 제거는 코드 기준으로 수행해 props 값 안정성을 유지합니다.
  - `isCEO` 계산은 기존대로 ID 기준(`FullVisibility` 포지션 ID 매칭)을 유지해 권한 의미 변화가 없게 합니다.

- `[server/channels/api4/team_org_roles_test.go](server/channels/api4/team_org_roles_test.go)`
  - `position_codes` 기대값을 `PositionDefinition.ID`에서 `PositionDefinition.Code`로 수정합니다.
  - 필요 시 멀티 포지션(Primary + Extra) 케이스를 보강해 코드 직렬화 값이 기대대로 저장되는지 검증합니다.

## 검증 계획
- 대상 테스트 실행:
  - `go test ./channels/api4 -run TestUpdateUserOrgProfileSyncsUserProps -count=1`
- 환경 제약(Windows symlink privilege)으로 실행 불가 시:
  - 코드/테스트 정합성 점검 결과와 함께 재실행 명령을 제공하고, 권한 설정 후 동일 테스트 재검증 가이드를 전달합니다.
