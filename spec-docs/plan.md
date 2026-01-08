# OKR.BEST 구현 계획서

사용자 요구사항에 대한 구현 방안을 정리한 문서입니다.
Mattermost 공식 기술 문서를 참조하여 작성되었습니다.

- 공식 문서: https://docs.mattermost.com/
- 개발자 문서: https://developers.mattermost.com/

---

## 목차

1. [프로젝트 커스터마이징 가이드](#1-프로젝트-커스터마이징-가이드)
2. [특정 기능 구현 방안](#2-특정-기능-구현-방안)
3. [외부 시스템 연동 계획](#3-외부-시스템-연동-계획)
4. [배포/운영 계획](#4-배포운영-계획)
5. [보안 및 규정 준수](#5-보안-및-규정-준수)
6. [성능 최적화](#6-성능-최적화)

---

## 1. 프로젝트 커스터마이징 가이드

### 1.1 UI/UX 커스터마이징

#### 브랜딩 변경

**시스템 콘솔 설정** (관리자 > 시스템 콘솔 > 사이트 구성)

| 설정 항목 | 설명 | 위치 |
|-----------|------|------|
| 사이트 이름 | 로그인 페이지 및 헤더에 표시 | `ServiceSettings.SiteURL` |
| 사이트 설명 | 로그인 페이지 설명 | `TeamSettings.SiteName` |
| 브랜드 이미지 | 로그인 페이지 로고 | 시스템 콘솔 > 커스터마이징 |
| 파비콘 | 브라우저 탭 아이콘 | `webapp/channels/src/images/` |

**코드 레벨 커스터마이징**

```bash
# 로고 이미지 변경
webapp/channels/src/images/logo.png
webapp/channels/src/images/favicon/

# 브랜드 색상 변경
webapp/channels/src/sass/components/_variables.scss
```

#### 테마 커스터마이징

**기본 테마 수정**

```scss
// webapp/channels/src/sass/components/_variables.scss
$primary-color: #166de0;
$sidebar-bg: #145dbf;
$sidebar-text: #ffffff;
$center-channel-bg: #ffffff;
$button-bg: #166de0;
```

**사용자 정의 테마 추가**

```json
// config.json
{
  "ThemeSettings": {
    "EnableThemeSelection": true,
    "DefaultTheme": "okrbest",
    "AllowCustomThemes": true
  }
}
```

**참조**: [Mattermost Theme Colors](https://docs.mattermost.com/preferences/customize-your-theme.html)

### 1.2 서버 설정 커스터마이징

#### 주요 설정 파일

| 파일 | 설명 |
|------|------|
| `config.json` | 메인 설정 파일 |
| `config.defaults.json` | 기본값 정의 |
| 환경 변수 | `MM_*` 접두사로 오버라이드 |

#### 필수 설정 항목

```json
{
  "ServiceSettings": {
    "SiteURL": "https://okr.best",
    "ListenAddress": ":8065",
    "ConnectionSecurity": "TLS",
    "EnableLocalMode": false
  },
  "SqlSettings": {
    "DriverName": "postgres",
    "DataSource": "postgres://user:pass@localhost/mattermost?sslmode=disable",
    "MaxIdleConns": 20,
    "MaxOpenConns": 300
  },
  "FileSettings": {
    "DriverName": "amazons3",
    "AmazonS3Bucket": "okrbest-files",
    "AmazonS3Region": "ap-northeast-2"
  }
}
```

**참조**: [Configuration Settings](https://docs.mattermost.com/configure/configuration-settings.html)

### 1.3 기능 활성화/비활성화

#### 주요 기능 토글

| 기능 | 설정 경로 | 기본값 |
|------|-----------|--------|
| 게스트 계정 | `GuestAccountsSettings.Enable` | false |
| 플러그인 | `PluginSettings.Enable` | true |
| 웹훅 | `ServiceSettings.EnableIncomingWebhooks` | true |
| 커스텀 이모지 | `ServiceSettings.EnableCustomEmoji` | true |
| 링크 미리보기 | `ServiceSettings.EnableLinkPreviews` | true |
| 파일 공유 | `FileSettings.EnableFileAttachments` | true |
| GIF 선택기 | `ServiceSettings.EnableGifPicker` | true |

#### 기능 플래그 활용

```go
// server/public/model/feature_flags.go
type FeatureFlags struct {
    PermalinkPreviews bool `json:"PermalinkPreviews"`
    CustomFeature     bool `json:"CustomFeature"`
}
```

### 1.4 국제화(i18n) 커스터마이징

#### 서버 측 번역

```bash
# 번역 파일 위치
server/i18n/ko.json
server/i18n/en.json
```

**새 번역 키 추가**

```json
// server/i18n/ko.json
{
  "app.okrbest.welcome": "OKR.BEST에 오신 것을 환영합니다",
  "app.okrbest.custom_message": "커스텀 메시지"
}
```

#### 웹앱 측 번역

```bash
# 번역 파일 위치
webapp/channels/src/i18n/ko.json
webapp/channels/src/i18n/en.json
```

**번역 사용**

```tsx
import {FormattedMessage} from 'react-intl';

<FormattedMessage
    id="app.okrbest.welcome"
    defaultMessage="Welcome to OKR.BEST"
/>
```

**참조**: [Localization](https://developers.mattermost.com/contribute/server/localization/)

---

## 2. 특정 기능 구현 방안

### 2.1 새로운 REST API 엔드포인트 추가

#### 구현 단계

```mermaid
flowchart LR
    A[API 핸들러] --> B[App Layer]
    B --> C[Store Interface]
    C --> D[SQL Store]
    D --> E[Database]
```

#### 단계별 구현

**1단계: 모델 정의**

```go
// server/public/model/okr.go
package model

type OKR struct {
    Id          string `json:"id"`
    UserId      string `json:"user_id"`
    TeamId      string `json:"team_id"`
    Objective   string `json:"objective"`
    KeyResults  []KeyResult `json:"key_results"`
    Period      string `json:"period"`
    Progress    int    `json:"progress"`
    CreateAt    int64  `json:"create_at"`
    UpdateAt    int64  `json:"update_at"`
}

type KeyResult struct {
    Id          string `json:"id"`
    OkrId       string `json:"okr_id"`
    Title       string `json:"title"`
    Target      float64 `json:"target"`
    Current     float64 `json:"current"`
    Unit        string `json:"unit"`
}

func (o *OKR) IsValid() *AppError {
    if o.Objective == "" {
        return NewAppError("OKR.IsValid", "model.okr.objective.app_error", nil, "", http.StatusBadRequest)
    }
    return nil
}
```

**2단계: Store 인터페이스 정의**

```go
// server/channels/store/store.go
type Store interface {
    // ... 기존 인터페이스
    OKR() OKRStore
}

type OKRStore interface {
    Save(okr *model.OKR) (*model.OKR, error)
    Get(id string) (*model.OKR, error)
    GetByUser(userId string) ([]*model.OKR, error)
    Update(okr *model.OKR) (*model.OKR, error)
    Delete(id string) error
}
```

**3단계: SQL Store 구현**

```go
// server/channels/store/sqlstore/okr_store.go
package sqlstore

type SqlOKRStore struct {
    *SqlStore
}

func newSqlOKRStore(sqlStore *SqlStore) store.OKRStore {
    return &SqlOKRStore{sqlStore}
}

func (s *SqlOKRStore) Save(okr *model.OKR) (*model.OKR, error) {
    okr.Id = model.NewId()
    okr.CreateAt = model.GetMillis()
    okr.UpdateAt = okr.CreateAt

    if _, err := s.GetMaster().NamedExec(`
        INSERT INTO OKRs (Id, UserId, TeamId, Objective, Period, Progress, CreateAt, UpdateAt)
        VALUES (:id, :userid, :teamid, :objective, :period, :progress, :createat, :updateat)
    `, okr); err != nil {
        return nil, err
    }
    return okr, nil
}

func (s *SqlOKRStore) Get(id string) (*model.OKR, error) {
    var okr model.OKR
    if err := s.GetReplica().Get(&okr, `SELECT * FROM OKRs WHERE Id = $1`, id); err != nil {
        return nil, err
    }
    return &okr, nil
}
```

**4단계: App Layer 구현**

```go
// server/channels/app/okr.go
package app

func (a *App) CreateOKR(okr *model.OKR) (*model.OKR, *model.AppError) {
    if err := okr.IsValid(); err != nil {
        return nil, err
    }

    result, err := a.Srv().Store().OKR().Save(okr)
    if err != nil {
        return nil, model.NewAppError("CreateOKR", "app.okr.save.app_error", nil, err.Error(), http.StatusInternalServerError)
    }

    return result, nil
}

func (a *App) GetOKR(id string) (*model.OKR, *model.AppError) {
    result, err := a.Srv().Store().OKR().Get(id)
    if err != nil {
        return nil, model.NewAppError("GetOKR", "app.okr.get.app_error", nil, err.Error(), http.StatusNotFound)
    }
    return result, nil
}
```

**5단계: API 핸들러 구현**

```go
// server/channels/api4/okr.go
package api4

func (api *API) InitOKR() {
    api.BaseRoutes.APIRoot.Handle("/okrs", api.APISessionRequired(createOKR)).Methods("POST")
    api.BaseRoutes.APIRoot.Handle("/okrs/{okr_id:[A-Za-z0-9]+}", api.APISessionRequired(getOKR)).Methods("GET")
    api.BaseRoutes.APIRoot.Handle("/okrs/{okr_id:[A-Za-z0-9]+}", api.APISessionRequired(updateOKR)).Methods("PUT")
    api.BaseRoutes.APIRoot.Handle("/okrs/{okr_id:[A-Za-z0-9]+}", api.APISessionRequired(deleteOKR)).Methods("DELETE")
    api.BaseRoutes.User.Handle("/okrs", api.APISessionRequired(getOKRsByUser)).Methods("GET")
}

func createOKR(c *Context, w http.ResponseWriter, r *http.Request) {
    var okr model.OKR
    if jsonErr := json.NewDecoder(r.Body).Decode(&okr); jsonErr != nil {
        c.SetInvalidParamWithErr("okr", jsonErr)
        return
    }

    okr.UserId = c.AppContext.Session().UserId

    createdOKR, appErr := c.App.CreateOKR(&okr)
    if appErr != nil {
        c.Err = appErr
        return
    }

    w.WriteHeader(http.StatusCreated)
    if err := json.NewEncoder(w).Encode(createdOKR); err != nil {
        c.Logger.Warn("Error writing response", mlog.Err(err))
    }
}

func getOKR(c *Context, w http.ResponseWriter, r *http.Request) {
    c.RequireOKRId()
    if c.Err != nil {
        return
    }

    okr, appErr := c.App.GetOKR(c.Params.OKRId)
    if appErr != nil {
        c.Err = appErr
        return
    }

    if err := json.NewEncoder(w).Encode(okr); err != nil {
        c.Logger.Warn("Error writing response", mlog.Err(err))
    }
}
```

**6단계: API 라우트 등록**

```go
// server/channels/api4/api.go
func (api *API) InitRoutes() {
    // ... 기존 라우트
    api.InitOKR()
}
```

**7단계: DB 마이그레이션**

```sql
-- server/channels/db/migrations/postgres/000100_create_okrs.up.sql
CREATE TABLE IF NOT EXISTS OKRs (
    Id VARCHAR(26) PRIMARY KEY,
    UserId VARCHAR(26) NOT NULL,
    TeamId VARCHAR(26),
    Objective TEXT NOT NULL,
    Period VARCHAR(20),
    Progress INT DEFAULT 0,
    CreateAt BIGINT,
    UpdateAt BIGINT,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

CREATE INDEX idx_okrs_user_id ON OKRs(UserId);
CREATE INDEX idx_okrs_team_id ON OKRs(TeamId);

CREATE TABLE IF NOT EXISTS KeyResults (
    Id VARCHAR(26) PRIMARY KEY,
    OkrId VARCHAR(26) NOT NULL,
    Title TEXT NOT NULL,
    Target DECIMAL(10,2),
    Current DECIMAL(10,2) DEFAULT 0,
    Unit VARCHAR(20),
    CreateAt BIGINT,
    UpdateAt BIGINT,
    FOREIGN KEY (OkrId) REFERENCES OKRs(Id) ON DELETE CASCADE
);

CREATE INDEX idx_keyresults_okr_id ON KeyResults(OkrId);
```

**참조**: [REST API Development](https://developers.mattermost.com/contribute/server/rest-api/)

### 2.2 웹앱 컴포넌트 개발

#### React 컴포넌트 구조

```
webapp/channels/src/components/okr/
├── okr_list/
│   ├── index.ts
│   ├── okr_list.tsx
│   └── okr_list.test.tsx
├── okr_item/
│   ├── index.ts
│   ├── okr_item.tsx
│   └── okr_item.scss
├── okr_form/
│   ├── index.ts
│   ├── okr_form.tsx
│   └── okr_form.scss
└── index.ts
```

#### 컴포넌트 구현 예시

```tsx
// webapp/channels/src/components/okr/okr_list/okr_list.tsx
import React, {useEffect, useState} from 'react';
import {useSelector, useDispatch} from 'react-redux';

import {getOKRsByUser} from 'actions/okr_actions';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import OKRItem from '../okr_item';

import './okr_list.scss';

const OKRList: React.FC = () => {
    const dispatch = useDispatch();
    const currentUserId = useSelector(getCurrentUserId);
    const [okrs, setOkrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOKRs = async () => {
            try {
                const result = await dispatch(getOKRsByUser(currentUserId));
                setOkrs(result.data);
            } catch (error) {
                console.error('Failed to fetch OKRs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOKRs();
    }, [currentUserId, dispatch]);

    if (loading) {
        return <div className="okr-list__loading">Loading...</div>;
    }

    return (
        <div className="okr-list">
            <h2 className="okr-list__title">My OKRs</h2>
            {okrs.length === 0 ? (
                <div className="okr-list__empty">No OKRs found</div>
            ) : (
                <div className="okr-list__items">
                    {okrs.map((okr) => (
                        <OKRItem key={okr.id} okr={okr} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OKRList;
```

#### Redux 액션/리듀서

```typescript
// webapp/channels/src/actions/okr_actions.ts
import {Client4} from 'mattermost-redux/client';
import {ActionFunc} from 'mattermost-redux/types/actions';

export function getOKRsByUser(userId: string): ActionFunc {
    return async (dispatch, getState) => {
        let data;
        try {
            data = await Client4.doFetch(`/api/v4/users/${userId}/okrs`, {method: 'GET'});
        } catch (error) {
            return {error};
        }

        dispatch({
            type: 'RECEIVED_OKRS',
            data,
        });

        return {data};
    };
}

export function createOKR(okr: OKR): ActionFunc {
    return async (dispatch) => {
        let data;
        try {
            data = await Client4.doFetch('/api/v4/okrs', {
                method: 'POST',
                body: JSON.stringify(okr),
            });
        } catch (error) {
            return {error};
        }

        dispatch({
            type: 'CREATED_OKR',
            data,
        });

        return {data};
    };
}
```

**참조**: [Web App Development](https://developers.mattermost.com/contribute/webapp/)

### 2.3 백그라운드 작업(Job) 추가

#### Job Worker 구현

```go
// server/channels/jobs/okr_reminder/worker.go
package okr_reminder

import (
    "github.com/mattermost/mattermost/server/public/model"
    "github.com/mattermost/mattermost/server/v8/channels/jobs"
)

type Worker struct {
    name      string
    stop      chan bool
    stopped   chan bool
    jobs      chan model.Job
    jobServer *jobs.JobServer
    app       jobs.AppIface
}

func MakeWorker(jobServer *jobs.JobServer, app jobs.AppIface) *Worker {
    return &Worker{
        name:      "OKRReminder",
        stop:      make(chan bool, 1),
        stopped:   make(chan bool, 1),
        jobs:      make(chan model.Job),
        jobServer: jobServer,
        app:       app,
    }
}

func (w *Worker) Run() {
    for {
        select {
        case <-w.stop:
            w.stopped <- true
            return
        case job := <-w.jobs:
            w.doJob(&job)
        }
    }
}

func (w *Worker) doJob(job *model.Job) {
    // OKR 리마인더 로직 구현
    // 1. 완료되지 않은 OKR 조회
    // 2. 해당 사용자에게 알림 전송
    
    w.jobServer.SetJobSuccess(job)
}
```

#### Job Scheduler 구현

```go
// server/channels/jobs/okr_reminder/scheduler.go
package okr_reminder

import (
    "time"
    
    "github.com/mattermost/mattermost/server/public/model"
    "github.com/mattermost/mattermost/server/v8/channels/jobs"
)

type Scheduler struct {
    jobServer *jobs.JobServer
}

func MakeScheduler(jobServer *jobs.JobServer) *Scheduler {
    return &Scheduler{jobServer: jobServer}
}

func (s *Scheduler) Enabled(cfg *model.Config) bool {
    return true // 또는 설정에 따라 활성화
}

func (s *Scheduler) NextScheduleTime(cfg *model.Config, now time.Time, pendingJobs bool, lastSuccessfulJob *model.Job) *time.Time {
    // 매주 월요일 오전 9시에 실행
    next := now.AddDate(0, 0, (8-int(now.Weekday()))%7)
    next = time.Date(next.Year(), next.Month(), next.Day(), 9, 0, 0, 0, next.Location())
    return &next
}

func (s *Scheduler) ScheduleJob(cfg *model.Config, pendingJobs bool, lastSuccessfulJob *model.Job) (*model.Job, *model.AppError) {
    job, err := s.jobServer.CreateJob(model.JobTypeOKRReminder, nil)
    if err != nil {
        return nil, err
    }
    return job, nil
}
```

**참조**: [Job Server](https://developers.mattermost.com/contribute/server/job-server/)

---

## 3. 외부 시스템 연동 계획

### 3.1 플러그인 개발 가이드

#### 플러그인 구조

```
okrbest-plugin/
├── plugin.json              # 매니페스트
├── server/                  # 서버 플러그인 (Go)
│   ├── main.go
│   ├── plugin.go
│   ├── api.go
│   └── configuration.go
├── webapp/                  # 웹앱 플러그인 (JS/TS)
│   ├── src/
│   │   ├── index.tsx
│   │   ├── components/
│   │   └── actions/
│   ├── package.json
│   └── webpack.config.js
└── Makefile
```

#### 플러그인 매니페스트

```json
// plugin.json
{
    "id": "com.okrbest.integration",
    "name": "OKR.BEST Integration",
    "description": "OKR management integration plugin",
    "homepage_url": "https://okr.best",
    "support_url": "https://okr.best/support",
    "version": "1.0.0",
    "min_server_version": "9.0.0",
    "server": {
        "executables": {
            "linux-amd64": "server/dist/plugin-linux-amd64",
            "darwin-amd64": "server/dist/plugin-darwin-amd64",
            "windows-amd64": "server/dist/plugin-windows-amd64.exe"
        }
    },
    "webapp": {
        "bundle_path": "webapp/dist/main.js"
    },
    "settings_schema": {
        "header": "OKR.BEST Integration Settings",
        "settings": [
            {
                "key": "EnableOKRReminders",
                "display_name": "Enable OKR Reminders",
                "type": "bool",
                "default": true
            },
            {
                "key": "ReminderFrequency",
                "display_name": "Reminder Frequency",
                "type": "dropdown",
                "options": [
                    {"display_name": "Daily", "value": "daily"},
                    {"display_name": "Weekly", "value": "weekly"},
                    {"display_name": "Monthly", "value": "monthly"}
                ],
                "default": "weekly"
            }
        ]
    }
}
```

#### 서버 플러그인 구현

```go
// server/plugin.go
package main

import (
    "sync"
    
    "github.com/mattermost/mattermost/server/public/plugin"
    "github.com/mattermost/mattermost/server/public/model"
)

type Plugin struct {
    plugin.MattermostPlugin
    configurationLock sync.RWMutex
    configuration     *configuration
}

func (p *Plugin) OnActivate() error {
    // 플러그인 활성화 시 초기화
    command := &model.Command{
        Trigger:          "okr",
        AutoComplete:     true,
        AutoCompleteDesc: "OKR management commands",
        AutoCompleteHint: "[create|list|update|delete]",
    }
    
    if err := p.API.RegisterCommand(command); err != nil {
        return err
    }
    
    return nil
}

func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
    switch args.Command {
    case "/okr create":
        return p.handleCreateOKR(args)
    case "/okr list":
        return p.handleListOKRs(args)
    default:
        return &model.CommandResponse{
            ResponseType: model.CommandResponseTypeEphemeral,
            Text:         "Unknown command. Use `/okr help` for available commands.",
        }, nil
    }
}

func (p *Plugin) MessageHasBeenPosted(c *plugin.Context, post *model.Post) {
    // 포스트 후처리 훅
    // 예: OKR 관련 키워드 감지 및 처리
}
```

#### 웹앱 플러그인 구현

```tsx
// webapp/src/index.tsx
import {Store, Action} from 'redux';
import {GlobalState} from 'mattermost-redux/types/store';

import OKRSidebar from './components/okr_sidebar';
import OKRModal from './components/okr_modal';

export default class Plugin {
    initialize(registry: any, store: Store<GlobalState, Action<any>>) {
        // 사이드바 컴포넌트 등록
        registry.registerLeftSidebarHeaderComponent(OKRSidebar);
        
        // 채널 헤더 버튼 등록
        registry.registerChannelHeaderButtonAction(
            () => <OKRIcon />,
            () => store.dispatch(openOKRModal()),
            'OKR',
            'Open OKR panel'
        );
        
        // 루트 컴포넌트 등록 (모달 등)
        registry.registerRootComponent(OKRModal);
        
        // WebSocket 이벤트 핸들러
        registry.registerWebSocketEventHandler(
            'custom_okr_updated',
            (message: any) => {
                store.dispatch(receivedOKRUpdate(message.data));
            }
        );
    }
}
```

**참조**: [Plugin Development](https://developers.mattermost.com/integrate/plugins/)

### 3.2 Incoming/Outgoing 웹훅

#### Incoming Webhook 설정

**1. 시스템 콘솔에서 활성화**
```json
{
  "ServiceSettings": {
    "EnableIncomingWebhooks": true
  }
}
```

**2. 웹훅 URL 호출**
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{
    "channel": "town-square",
    "username": "OKR Bot",
    "icon_url": "https://okr.best/icon.png",
    "text": "## Q1 OKR 리마인더\n목표 달성률을 확인해주세요!",
    "attachments": [{
      "fallback": "OKR Progress",
      "color": "#36a64f",
      "title": "팀 OKR 현황",
      "fields": [
        {"title": "완료", "value": "3개", "short": true},
        {"title": "진행중", "value": "5개", "short": true}
      ]
    }]
  }' \
  https://okr.best/hooks/xxx-xxx-xxx
```

#### Outgoing Webhook 설정

**트리거 설정**
- 트리거 워드: `@okr`, `#okr`
- 콜백 URL: `https://external-api.example.com/okr/webhook`

**콜백 서버 구현**
```python
# Flask 예시
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/okr/webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    
    # 트리거된 메시지 처리
    text = data.get('text', '')
    user_name = data.get('user_name', '')
    
    # 응답 생성
    response = {
        "response_type": "in_channel",
        "text": f"@{user_name}님의 OKR 요청을 처리했습니다.",
        "username": "OKR Bot"
    }
    
    return jsonify(response)
```

**참조**: [Webhooks](https://developers.mattermost.com/integrate/webhooks/)

### 3.3 OAuth 2.0 연동

#### 외부 서비스 OAuth 연동

**설정**
```json
{
  "GitLabSettings": {
    "Enable": true,
    "Secret": "your-client-secret",
    "Id": "your-client-id",
    "Scope": "read_user",
    "AuthEndpoint": "https://gitlab.com/oauth/authorize",
    "TokenEndpoint": "https://gitlab.com/oauth/token",
    "UserAPIEndpoint": "https://gitlab.com/api/v4/user"
  }
}
```

#### 커스텀 OAuth 제공자 추가

```go
// server/channels/app/oauthproviders/custom/custom.go
package custom

import (
    "github.com/mattermost/mattermost/server/public/model"
    "github.com/mattermost/mattermost/server/v8/einterfaces"
)

type CustomProvider struct{}

func init() {
    einterfaces.RegisterOAuthProvider("custom", &CustomProvider{})
}

func (p *CustomProvider) GetUserFromJSON(data []byte) (*model.User, error) {
    // JSON 응답을 User 모델로 변환
}

func (p *CustomProvider) GetAuthDataFromJSON(data []byte) string {
    // 인증 데이터 추출
}
```

**참조**: [OAuth 2.0](https://developers.mattermost.com/integrate/admin-guide/admin-oauth2/)

### 3.4 Bot 계정 활용

#### Bot 생성

```bash
# mmctl로 봇 생성
mmctl bot create okr-bot --display-name "OKR Bot" --description "OKR management bot"

# 토큰 생성
mmctl token generate okr-bot "OKR Bot Token"
```

#### Bot API 사용

```go
// Bot을 사용한 메시지 전송
func (p *Plugin) sendBotMessage(channelId, message string) error {
    bot, err := p.API.GetBot(p.botID, false)
    if err != nil {
        return err
    }
    
    post := &model.Post{
        UserId:    bot.UserId,
        ChannelId: channelId,
        Message:   message,
    }
    
    _, err = p.API.CreatePost(post)
    return err
}
```

**참조**: [Bot Accounts](https://developers.mattermost.com/integrate/reference/bot-accounts/)

---

## 4. 배포/운영 계획

### 4.1 Docker 배포

#### Docker Compose 구성

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mmuser
      POSTGRES_PASSWORD: mmuser_password
      POSTGRES_DB: mattermost
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  mattermost:
    image: mattermost/mattermost-enterprise-edition:latest
    depends_on:
      - postgres
    environment:
      MM_SQLSETTINGS_DRIVERNAME: postgres
      MM_SQLSETTINGS_DATASOURCE: postgres://mmuser:mmuser_password@postgres:5432/mattermost?sslmode=disable
      MM_SERVICESETTINGS_SITEURL: https://okr.best
      MM_FILESETTINGS_DRIVERNAME: amazons3
      MM_FILESETTINGS_AMAZONS3ACCESSKEYID: ${AWS_ACCESS_KEY}
      MM_FILESETTINGS_AMAZONS3SECRETACCESSKEY: ${AWS_SECRET_KEY}
      MM_FILESETTINGS_AMAZONS3BUCKET: okrbest-files
      MM_FILESETTINGS_AMAZONS3REGION: ap-northeast-2
    volumes:
      - mattermost_config:/mattermost/config
      - mattermost_data:/mattermost/data
      - mattermost_logs:/mattermost/logs
      - mattermost_plugins:/mattermost/plugins
    ports:
      - "8065:8065"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - mattermost
    restart: unless-stopped

volumes:
  postgres_data:
  mattermost_config:
  mattermost_data:
  mattermost_logs:
  mattermost_plugins:
```

#### Nginx 설정

```nginx
# nginx.conf
upstream mattermost {
    server mattermost:8065;
    keepalive 32;
}

server {
    listen 80;
    server_name okr.best;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name okr.best;

    ssl_certificate /etc/letsencrypt/live/okr.best/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/okr.best/privkey.pem;

    location ~ /api/v[0-9]+/(users/)?websocket$ {
        proxy_pass http://mattermost;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://mattermost;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

**참조**: [Docker Deployment](https://docs.mattermost.com/install/install-docker.html)

### 4.2 Kubernetes 배포

#### Helm Chart 설치

```bash
# Helm repo 추가
helm repo add mattermost https://helm.mattermost.com
helm repo update

# 설치
helm install okrbest mattermost/mattermost-enterprise-edition \
  --namespace okrbest \
  --create-namespace \
  --values values.yaml
```

#### values.yaml

```yaml
# values.yaml
global:
  siteUrl: "https://okr.best"
  mattermostLicense: ""

image:
  repository: mattermost/mattermost-enterprise-edition
  tag: latest
  pullPolicy: IfNotPresent

replicaCount: 3

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: okr.best
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: okrbest-tls
      hosts:
        - okr.best

mysql:
  enabled: false

externalDB:
  enabled: true
  externalDriverType: postgres
  externalConnectionString: "postgres://user:pass@postgres-host:5432/mattermost?sslmode=require"

persistence:
  data:
    enabled: true
    size: 50Gi
    storageClass: standard
  plugins:
    enabled: true
    size: 5Gi
    storageClass: standard

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

**참조**: [Kubernetes Deployment](https://docs.mattermost.com/install/install-kubernetes.html)

### 4.3 고가용성(HA) 구성

#### 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph clients [Clients]
        Web[Web Browser]
        Mobile[Mobile App]
        Desktop[Desktop App]
    end

    subgraph lb [Load Balancer]
        LB[HAProxy / AWS ALB]
    end

    subgraph cluster [Mattermost Cluster]
        Node1[MM Node 1]
        Node2[MM Node 2]
        Node3[MM Node 3]
    end

    subgraph cache [Cache Layer]
        Redis[(Redis Cluster)]
    end

    subgraph db [Database]
        PG_Primary[(PostgreSQL Primary)]
        PG_Replica1[(PostgreSQL Replica 1)]
        PG_Replica2[(PostgreSQL Replica 2)]
    end

    subgraph storage [File Storage]
        S3[S3 / MinIO]
    end

    clients --> LB
    LB --> Node1
    LB --> Node2
    LB --> Node3

    Node1 --> Redis
    Node2 --> Redis
    Node3 --> Redis

    Node1 --> PG_Primary
    Node2 --> PG_Primary
    Node3 --> PG_Primary

    PG_Primary --> PG_Replica1
    PG_Primary --> PG_Replica2

    Node1 --> S3
    Node2 --> S3
    Node3 --> S3

    Node1 <-.-> Node2
    Node2 <-.-> Node3
    Node1 <-.-> Node3
```

#### 클러스터 설정

```json
{
  "ClusterSettings": {
    "Enable": true,
    "ClusterName": "okrbest-production",
    "OverrideHostname": "",
    "NetworkInterface": "",
    "BindAddress": "",
    "AdvertiseAddress": "",
    "UseIpAddress": true,
    "EnableGossipCompression": true,
    "GossipPort": 8074,
    "StreamingPort": 8075,
    "MaxIdleConns": 100,
    "MaxIdleConnsPerHost": 128,
    "IdleConnTimeoutMilliseconds": 90000
  }
}
```

**참조**: [High Availability](https://docs.mattermost.com/scale/high-availability-cluster.html)

### 4.4 모니터링 및 로깅

#### Prometheus + Grafana 설정

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'mattermost'
    scrape_interval: 15s
    static_configs:
      - targets: ['mattermost:8067']
```

#### 주요 메트릭

| 메트릭 | 설명 | 알람 임계값 |
|--------|------|-------------|
| `mattermost_http_requests_total` | HTTP 요청 수 | - |
| `mattermost_db_connections_open` | DB 연결 수 | > 80% |
| `mattermost_websocket_connections` | WebSocket 연결 수 | - |
| `mattermost_post_total` | 총 포스트 수 | - |
| `mattermost_cluster_health` | 클러스터 상태 | != healthy |

#### 로그 설정

```json
{
  "LogSettings": {
    "EnableConsole": true,
    "ConsoleLevel": "INFO",
    "ConsoleJson": true,
    "EnableFile": true,
    "FileLevel": "INFO",
    "FileJson": true,
    "FileLocation": "/mattermost/logs/mattermost.log",
    "EnableWebhookDebugging": false,
    "EnableDiagnostics": true
  }
}
```

#### ELK Stack 연동

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /mattermost/logs/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "mattermost-%{+yyyy.MM.dd}"
```

**참조**: [Performance Monitoring](https://docs.mattermost.com/scale/performance-monitoring.html)

### 4.5 백업/복구 전략

#### 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/mattermost"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL 백업
pg_dump -h localhost -U mmuser mattermost | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# 파일 백업 (로컬 스토리지 사용 시)
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /mattermost/data/

# 설정 백업
cp /mattermost/config/config.json "$BACKUP_DIR/config_$DATE.json"

# 30일 이상 된 백업 삭제
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

#### 복구 절차

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

# 서비스 중지
docker-compose stop mattermost

# 데이터베이스 복구
gunzip -c "$BACKUP_FILE" | psql -h localhost -U mmuser mattermost

# 서비스 재시작
docker-compose start mattermost
```

**참조**: [Backup and Disaster Recovery](https://docs.mattermost.com/deploy/backup-disaster-recovery.html)

---

## 5. 보안 및 규정 준수

### 5.1 인증 설정

#### LDAP/AD 연동

```json
{
  "LdapSettings": {
    "Enable": true,
    "LdapServer": "ldap.example.com",
    "LdapPort": 389,
    "ConnectionSecurity": "STARTTLS",
    "BaseDN": "dc=example,dc=com",
    "BindUsername": "cn=admin,dc=example,dc=com",
    "BindPassword": "password",
    "UserFilter": "(objectClass=person)",
    "GroupFilter": "(objectClass=group)",
    "EmailAttribute": "mail",
    "UsernameAttribute": "sAMAccountName",
    "IdAttribute": "objectGUID",
    "FirstNameAttribute": "givenName",
    "LastNameAttribute": "sn",
    "PositionAttribute": "title",
    "SyncIntervalMinutes": 60
  }
}
```

#### SAML 2.0 연동

```json
{
  "SamlSettings": {
    "Enable": true,
    "EnableSyncWithLdap": false,
    "Verify": true,
    "Encrypt": false,
    "IdpUrl": "https://idp.example.com/sso",
    "IdpDescriptorUrl": "https://idp.example.com/metadata",
    "IdpMetadataUrl": "https://idp.example.com/metadata.xml",
    "AssertionConsumerServiceURL": "https://okr.best/login/sso/saml",
    "ServiceProviderIdentifier": "https://okr.best/login/sso/saml",
    "IdpCertificateFile": "/mattermost/config/saml-idp.crt",
    "EmailAttribute": "email",
    "UsernameAttribute": "username",
    "FirstNameAttribute": "firstName",
    "LastNameAttribute": "lastName"
  }
}
```

**참조**: [Authentication](https://docs.mattermost.com/onboard/sso-saml.html)

### 5.2 권한 관리

#### 역할 기반 접근 제어

```json
{
  "ServiceSettings": {
    "EnableCustomRoles": true
  }
}
```

#### 커스텀 역할 생성

```bash
# mmctl로 역할 생성
mmctl roles create okr_manager --name "OKR Manager" --description "Can manage OKRs"

# 권한 부여
mmctl roles assign okr_manager --permission create_okr
mmctl roles assign okr_manager --permission edit_okr
mmctl roles assign okr_manager --permission delete_okr
```

### 5.3 데이터 보존 정책

```json
{
  "DataRetentionSettings": {
    "EnableMessageDeletion": true,
    "MessageRetentionDays": 365,
    "EnableFileDeletion": true,
    "FileRetentionDays": 365
  }
}
```

### 5.4 감사 로그

```json
{
  "ExperimentalAuditSettings": {
    "FileEnabled": true,
    "FileName": "/mattermost/logs/audit.log",
    "FileMaxSizeMB": 100,
    "FileMaxAgeDays": 0,
    "FileMaxBackups": 0,
    "FileCompress": false,
    "FileMaxQueueSize": 1000
  }
}
```

**참조**: [Compliance](https://docs.mattermost.com/comply/compliance-export.html)

---

## 6. 성능 최적화

### 6.1 캐싱 전략

#### Redis 설정

```json
{
  "CacheSettings": {
    "Enable": true,
    "CacheType": "redis",
    "RedisAddress": "redis:6379",
    "RedisPassword": "",
    "RedisDB": 0
  }
}
```

#### 캐시 대상

| 데이터 | TTL | 설명 |
|--------|-----|------|
| 세션 | 24h | 사용자 세션 정보 |
| 사용자 프로필 | 30m | 사용자 기본 정보 |
| 채널 정보 | 30m | 채널 메타데이터 |
| 설정 | 5m | 시스템 설정 |

### 6.2 데이터베이스 튜닝

#### PostgreSQL 설정

```sql
-- postgresql.conf 최적화
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 256MB
max_connections = 500
random_page_cost = 1.1
effective_io_concurrency = 200

-- 인덱스 추가
CREATE INDEX CONCURRENTLY idx_posts_channel_id_delete_at ON Posts(ChannelId, DeleteAt);
CREATE INDEX CONCURRENTLY idx_posts_user_id ON Posts(UserId);
CREATE INDEX CONCURRENTLY idx_posts_create_at ON Posts(CreateAt DESC);
```

#### 연결 풀 설정

```json
{
  "SqlSettings": {
    "MaxIdleConns": 20,
    "MaxOpenConns": 300,
    "ConnMaxLifetimeMilliseconds": 3600000,
    "ConnMaxIdleTimeMilliseconds": 300000,
    "Trace": false,
    "QueryTimeout": 30
  }
}
```

### 6.3 부하 테스트

#### 테스트 도구

```bash
# loadtest 도구 설치
go install github.com/mattermost/mattermost-load-test-ng@latest

# 설정 파일
cat > config.json << EOF
{
  "ConnectionConfiguration": {
    "ServerURL": "https://okr.best",
    "WebSocketURL": "wss://okr.best",
    "AdminEmail": "admin@okr.best",
    "AdminPassword": "password"
  },
  "UsersConfiguration": {
    "InitialActiveUsers": 1000,
    "MaxActiveUsers": 5000
  }
}
EOF

# 부하 테스트 실행
mattermost-load-test-ng loadtest --config config.json
```

**참조**: [Performance](https://docs.mattermost.com/scale/scaling-for-enterprise.html)

---

## 부록: 체크리스트

### 배포 전 체크리스트

- [ ] 데이터베이스 백업 완료
- [ ] SSL 인증서 설정
- [ ] 환경 변수 설정
- [ ] 파일 스토리지 연결 확인
- [ ] 이메일 설정 테스트
- [ ] 로그 설정 확인
- [ ] 모니터링 설정
- [ ] 방화벽 규칙 설정

### 보안 체크리스트

- [ ] 강력한 비밀번호 정책 설정
- [ ] MFA 활성화
- [ ] 세션 타임아웃 설정
- [ ] HTTPS 강제
- [ ] Rate Limiting 설정
- [ ] 감사 로그 활성화

### 성능 체크리스트

- [ ] 데이터베이스 인덱스 최적화
- [ ] 캐싱 설정
- [ ] 이미지 프록시 설정
- [ ] CDN 설정
- [ ] 부하 테스트 완료

---

## 참고 링크

- [Mattermost Documentation](https://docs.mattermost.com/)
- [Developer Documentation](https://developers.mattermost.com/)
- [API Reference](https://api.mattermost.com/)
- [Plugin Development](https://developers.mattermost.com/integrate/plugins/)
- [Deployment Guide](https://docs.mattermost.com/guides/deployment.html)
- [Administrator's Guide](https://docs.mattermost.com/guides/administration.html)

