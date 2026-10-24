# server baseline @ e1ec43521f 2026-10-25T02:18:58+09:00
# 범위: check-style 전체 + 접촉 패키지 테스트(public/model 전체, sqlstore는 TestTeamStore 필터)
# 마감 게이트는 같은 명령을 재실행해 이 목록과 diff한다. 전체 스위트는 PR CI가 집행한다.

## cmd: make check-style
	-structuredLogging \
	-mlogFieldNaming \
	-inconsistentReceiverName \
	-emptyStrCmp \
	-tFatal \
	-configtelemetry \
	-errorAssertions \
	-requestCtxNaming \
	-license \
	-inconsistentReceiverName.ignore=session_serial_gen.go,team_member_serial_gen.go,user_serial_gen.go,utils_serial_gen.go \
	-noSelectStar \
	-concurrentIndex \
	-concurrentIndex.path=./channels/db/migrations/ \
	-concurrentIndex.minMigration=166 \
	-sortSlices \
	./...
go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.12.2
/home/sdh/okrbest/okrbest/server/bin/golangci-lint run ./... ./public/...
0 issues.
go fix -diff ./...
exit=0

## cmd: go test ./public/model/
ok  	github.com/mattermost/mattermost/server/public/model	19.792s
exit=0

## cmd: go test -run 'TestTeamStore' ./channels/store/sqlstore/
ok  	github.com/mattermost/mattermost/server/v8/channels/store/sqlstore	1.097s
exit=0

# 검증 노트: 1초 완료가 캐시인지 의심되어 -count=1 -v로 재확인했다.
#   --- PASS: TestTeamStore (0.47s), subtest PASS 270건, ok 0.876s — 실제 실행 맞음.
# 마감 게이트도 -count=1로 돌린다.
