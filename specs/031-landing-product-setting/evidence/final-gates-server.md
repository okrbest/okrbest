# server final gates @ 7c124cd746 2026-10-25T02:45:34+09:00
# 기준선(evidence/baseline-server.md)과 같은 명령 + -count=1

## cmd: make check-style
	-sortSlices \
	./...
go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.12.2
/home/sdh/okrbest/okrbest/server/bin/golangci-lint run ./... ./public/...
0 issues.
go fix -diff ./...
exit=0

## cmd: go test -count=1 ./public/model/
ok  	github.com/mattermost/mattermost/server/public/model	19.826s
exit=0

## cmd: go test -count=1 -run 'TestTeamStore' ./channels/store/sqlstore/
ok  	github.com/mattermost/mattermost/server/v8/channels/store/sqlstore	1.002s
exit=0

## cmd: make i18n-check
Using pgvector/pgvector image for PostgreSQL
cd ../tools/mmgotool && go install .
/home/sdh/okrbest/okrbest/server/bin/mmgotool i18n clean-empty --portal-dir="" --check
/home/sdh/okrbest/okrbest/server/bin/mmgotool i18n check-empty-src --portal-dir=""
exit=0

## cmd: go mod tidy 클린 확인 (public)
go: downloading github.com/jackc/pgx/v5 v5.9.2
go: downloading github.com/mdelapenya/tlscert v0.2.0
go: downloading github.com/moby/sys/mount v0.3.5
go: downloading github.com/AdaLogics/go-fuzz-headers v0.0.0-20240806141605-e8a1dd7889d6
go: downloading gotest.tools/v3 v3.5.2
go: downloading github.com/Microsoft/go-winio v0.6.4
go: downloading github.com/creack/pty v1.1.24
go: downloading github.com/moby/sys/mountinfo v0.7.2
go: downloading pgregory.net/rapid v1.2.0
go: downloading go.opentelemetry.io/otel/sdk v1.47.0
go: downloading go.opentelemetry.io/otel/sdk/metric v1.47.0
go: downloading github.com/Azure/go-ansiterm v0.0.0-20261013165250-51075c6ea6bc
go: downloading github.com/ebitengine/purego v0.11.1
go: downloading github.com/yusufpapurcu/wmi v1.2.4
go: downloading github.com/lufia/plan9stats v0.0.0-20260802145828-341c2f0c90b5
go: downloading github.com/power-devops/perfstat v0.0.0-20260916203055-22a1a467d9f0
go: downloading github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761
go: downloading github.com/jackc/puddle/v2 v2.2.2
go: downloading github.com/go-ole/go-ole v1.3.0
tidy-exit=0
