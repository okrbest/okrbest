# Mattermost SMTP 이메일 알림 설정 운영 가이드

참고 문서:
- [Mattermost SMTP email setup](https://docs.mattermost.com/administration-guide/configure/smtp-email.html)
- [Google Workspace SMTP Relay](https://knowledge.workspace.google.com/admin/gmail/advanced/route-outgoing-smtp-relay-messages-through-google?hl=en)

## 1) 문서 목적

이 문서는 OKR.BEST(Mattermost 기반)에서 SMTP 이메일 알림을 운영 환경에 안정적으로 적용하기 위한 실무 가이드입니다.

다음 내용을 한 번에 다룹니다.
- System Console 설정과 `config.json` 키 매핑
- 코드 기준 실제 메일 발송 조건
- Google Workspace SMTP Relay 연동 절차
- 검증/트러블슈팅/운영 체크리스트

## 2) 먼저 이해해야 할 핵심

- SMTP 설정이 맞아도, 사용자별 알림 조건 때문에 일부 사용자에게는 메일이 가지 않을 수 있습니다.
- `SendEmailNotifications`는 포스트 기반 알림(멘션/DM/스레드 등)에 직접 영향을 줍니다.
- 계정 관련 메일(초대/재설정/인증)과 포스트 알림은 운영 체감상 다르게 보일 수 있으므로 분리해서 검증해야 합니다.
- `SMTPPort`는 문자열입니다. 예: `"587"`, `"465"`.

### 2-1) 빠른 선택 가이드 (Google vs AWS)

운영자가 가장 먼저 결정해야 할 것은 SMTP 공급자입니다.

- Google Workspace SMTP Relay를 사용할 때
  - 사내 Google Workspace 보안/라우팅 정책을 그대로 적용하고 싶을 때
  - 고정 IP allowlist 또는 Google SMTP AUTH 기반 통제가 필요한 환경
  - 이 문서의 `7) Google Workspace SMTP Relay 연동 가이드`부터 확인

- AWS SES를 사용할 때
  - AWS 중심 인프라에서 서비스 전용 SMTP를 표준화하고 싶을 때
  - 리전별 SES 엔드포인트 + SMTP 자격증명 방식으로 운영할 때
  - 이 문서의 `9) AWS SES로 SMTP 구성하기`부터 확인

최종 적용 순서는 공급자와 관계없이 아래 공통 흐름을 따르는 것을 권장합니다.
- `10-1) 공통 적용 절차`
- `11) 공통 검증 절차`
- `12) 트러블슈팅(공통/공급자별)`

선택 기준(실무):
- 보안 정책 우선
  - 조직 정책상 `Require TLS`와 IP 통제가 강하면 Google Relay를 우선 검토
  - 서비스 전용 자격증명/리전 표준화가 중요하면 AWS SES를 우선 검토
- 네트워크 특성
  - 고정 공인 IP가 안정적으로 유지되면 Google IP allowlist가 단순
  - 오토스케일/가변 IP 환경이면 SMTP AUTH 중심(SES 또는 Google AUTH)이 운영상 유리
- 대량 발송/평판 운영
  - Google 조직 정책/한도 중심 운영이면 Google Relay
  - SES의 반송/컴플레인 지표를 기반으로 평판 모니터링하고 싶으면 AWS SES

### 2-2) 진입 시나리오 (처음 도입 vs 기존 이전)

- 처음 도입(신규 구축)
  1. `3) System Console 경로와 설정 키 매핑`으로 필수 키 확인
  2. `10) 적용 절차`에서 공통 절차 수행
  3. 공급자별 절차(`10-2` 또는 `10-3`) 반영
  4. `11) 검증 절차` 완료 후 운영 전환
- 기존 SMTP에서 이전(마이그레이션)
  1. 기존 발신 도메인/SPF/DKIM/Reply-To 정책을 먼저 인벤토리
  2. 신규 공급자 설정을 병렬 준비 후 `Test Connection` 선검증
  3. 저위험 사용자 그룹으로 단계 전환(canary) 후 전체 전환
  4. 전환 직후 `12) 트러블슈팅` 기준으로 실패 증상 집중 모니터링

## 3) System Console 경로와 설정 키 매핑

### 3-1) Authentication > Email

다음 4개 설정은 SMTP 자체보다 **계정 생성/로그인/인증 흐름**을 제어합니다.
설명 포맷은 `값 의미 -> 영향 -> 권장 -> 주의 -> 확인법` 순서를 사용합니다.

- `EmailSettings.EnableSignUpWithEmail`
  - 값 의미: 이메일+비밀번호 신규 가입 허용 여부
  - 영향: `false`일 때 이메일 회원가입 경로 차단
  - 권장:
    - SSO 전용 조직: `false`
    - 일반 조직: `true`
  - 주의: `TeamSettings.EnableUserCreation=false`이면 이 값이 `true`여도 가입이 차단될 수 있음
  - 확인법:
    - 실제 회원가입 화면/API 시도 시 `signup_email_disabled` 계열 오류 확인
    - `System Console > Logs`에서 가입 거부 로그 확인
  - 코드 근거: `server/channels/app/user.go`의 `IsUserSignUpAllowed()`

- `EmailSettings.RequireEmailVerification`
  - 값 의미: 로그인 전에 이메일 인증 완료를 강제할지
  - 영향: `true`일 때
    - 미인증 사용자는 로그인 거부
    - 포스트 알림 이메일에서도 미인증 수신자 제외
  - 권장:
    - 운영 환경: `true`
    - 빠른 로컬 개발: 필요 시 `false`
  - 주의: 운영에서 `false`로 두면 미인증 계정 유입 시 계정 신뢰도가 낮아질 수 있음
  - 확인법:
    - 미인증 계정 로그인 시 `not_verified` 계열 응답 확인
    - 멘션 알림 테스트에서 미인증 수신자 제외 동작 확인
  - 코드 근거:
    - 로그인 거부: `server/channels/app/authentication.go`
    - 알림 제외: `server/channels/app/notification.go`

- `EmailSettings.EnableSignInWithEmail`
  - 값 의미: 로그인 ID로 이메일 주소 사용 허용
  - 영향: `false`일 때 이메일 주소로 로그인 불가(다른 로그인 경로만 사용)
  - 권장: 일반 사용자 UX를 위해 `true`를 기본 검토
  - 주의: `EnableSignInWithUsername`와 동시 `false`면 로컬 로그인 경로가 사실상 차단
  - 확인법: 이메일로 로그인 시도 후 `GetUserForLogin` 경로 에러 여부 확인
  - 코드 근거: `server/channels/app/login.go`의 `GetUserForLogin()` 분기

- `EmailSettings.EnableSignInWithUsername`
  - 값 의미: 로그인 ID로 username 사용 허용
  - 영향: `false`일 때 username 로그인 불가
  - 권장: 헬프데스크/운영 계정에서 username 로그인 사용 중이면 `true` 유지
  - 주의: 이메일 로그인만 허용하는 정책이라면 사용자 안내 문구를 함께 정비
  - 확인법: username 로그인 시도 후 차단 여부 확인
  - 코드 근거: `server/channels/app/login.go`의 `GetUserForLogin()` 분기

조합 규칙(중요):
- `EnableSignInWithEmail=false` + `EnableSignInWithUsername=false`
  - 이메일/사용자명 기반 로그인이 모두 막혀서 일반 로컬 로그인 경로가 사실상 차단됩니다.
- `EnableSignUpWithEmail=false` + `EnableSignInWithEmail=true`
  - 신규 가입은 막고, 기존 이메일 계정 로그인은 허용하는 운영 패턴입니다.

Authentication 설정 예시(`config.json`):

```json
{
  "EmailSettings": {
    "EnableSignUpWithEmail": false,
    "RequireEmailVerification": true,
    "EnableSignInWithEmail": true,
    "EnableSignInWithUsername": false
  }
}
```

Authentication 설정 예시(환경변수):

```bash
MM_EMAILSETTINGS_ENABLESIGNUPWITHEMAIL=false
MM_EMAILSETTINGS_REQUIREEMAILVERIFICATION=true
MM_EMAILSETTINGS_ENABLESIGNINWITHEMAIL=true
MM_EMAILSETTINGS_ENABLESIGNINWITHUSERNAME=false
```

### 3-2) Environment > SMTP

핵심 요약:
- 이 구간은 "어느 SMTP 서버에, 어떤 보안/인증 방식으로 붙을지"를 결정합니다.
- 각 값은 `연결 성공/인증 성공/암호화 강제`의 세 축으로 함께 검토해야 합니다.

- `EmailSettings.SMTPServer`
  - 값 의미: SMTP 서버 호스트명/FQDN
  - 영향: DNS 해석 실패나 오타가 있으면 즉시 연결 실패
  - 권장: 공급자가 제공한 공식 FQDN 사용(예: `smtp-relay.gmail.com`, `email-smtp.<region>.amazonaws.com`)
  - 주의: SES는 자격증명 생성 리전과 엔드포인트 리전 불일치 시 인증/전송 실패 가능
  - 확인법: `Test Connection` 실패 시 호스트 오타/DNS/리전 일치 여부 우선 확인

- `EmailSettings.SMTPPort`
  - 값 의미: SMTP 연결 포트(문자열)
  - 영향: 보안 모드와 포트 조합이 맞지 않으면 TLS/핸드셰이크 오류
  - 권장:
    - STARTTLS: 보통 `"587"`
    - TLS(implicit): 보통 `"465"`
  - 주의: 숫자처럼 보여도 문자열로 저장해야 하며, 잘못된 조합(`465+STARTTLS` 등)은 실패율 증가
  - 확인법: `System Console > Logs`에서 TLS handshake/connection error 문자열 확인

- `EmailSettings.ConnectionSecurity` (`""`, `TLS`, `STARTTLS`)
  - 값 의미: 전송 구간 암호화 방식
  - 영향:
    - `TLS`: 연결 시작부터 TLS
    - `STARTTLS`: 평문 연결 후 TLS 업그레이드
    - `""`: 암호화 없이 연결
  - 권장: `TLS` 또는 `STARTTLS`만 사용
  - 주의: `SMTPUsername`/`SMTPPassword`를 사용하는 경우 공식 문서 기준 TLS 계열이 사실상 필수
  - 확인법: 테스트 시 인증 전/후 실패 지점을 분리 확인(연결 실패 vs 인증 실패)
  - 코드 근거: `server/platform/shared/mail/mail.go` (`ConnectToSMTPServerAdvanced`, `NewSMTPClientAdvanced`)

- `EmailSettings.EnableSMTPAuth`
  - 값 의미: SMTP AUTH 수행 여부
  - 영향: `true`일 때만 SMTP 사용자/비밀번호로 인증 시도
  - 권장:
    - 외부 SMTP(SES/Google Relay AUTH 등): 보통 `true`
    - IP allowlist 릴레이(인증 생략 정책): `false` 가능
  - 주의: `false`인데 공급자 측 AUTH 필수 정책이면 즉시 릴레이 거부
  - 확인법: 실패 문자열이 `authentication failed`인지 `relay denied`인지 구분
  - 코드 근거: `server/platform/shared/mail/mail.go` (`if config.EnableSMTPAuth { ... }`)

- `EmailSettings.SMTPUsername`
  - 값 의미: SMTP 인증 계정
  - 영향: `EnableSMTPAuth=true`에서만 실질 사용
  - 권장: 서비스 전용 계정 사용(사람 계정 직접 사용 지양)
  - 주의: Google/AWS 모두 사람 개인 계정 의존 시 비밀번호 정책/비활성화로 장애 가능
  - 확인법: 자격증명 교체 후 테스트 메일로 즉시 재검증

- `EmailSettings.SMTPPassword`
  - 값 의미: SMTP 인증 비밀번호/토큰
  - 영향: 인증 실패 시 `authentication failed`류 오류
  - 권장: 시크릿 매니저/환경변수로 관리, 문서/코드 저장소에 평문 기록 금지
  - 주의: AWS SES SMTP 비밀번호는 IAM 콘솔 로그인 비밀번호와 다름
  - 확인법: 로테이션 직후 `Test Connection` + 실사용 알림 1건을 함께 검증

- `EmailSettings.SkipServerCertificateVerification`
  - 값 의미: 서버 인증서 검증 생략 여부
  - 영향: TLS 실패 우회가 가능하지만 MITM 위험 증가
  - 권장: 항상 `false`; 장애 진단 시 임시 `true` 후 즉시 원복
  - 주의: 운영 상시 `true`는 보안감사에서 치명 리스크
  - 확인법: 진단 후 원복 여부를 체크리스트에 포함
  - 코드 근거: `server/platform/shared/mail/mail.go` (`InsecureSkipVerify`)

- `EmailSettings.SMTPServerTimeout`
  - 값 의미: SMTP 연결/처리 타임아웃(초)
  - 영향: 너무 짧으면 간헐 실패, 너무 길면 장애 감지 지연
  - 권장: 기본 10초에서 네트워크 품질에 따라 10~30초 범위 조정
  - 주의: 프록시/중계 장비가 많을수록 너무 낮은 타임아웃은 오탐 장애를 유발
  - 확인법: 피크 시간대 실패율 기준으로 10/20/30초 단계 조정
  - 코드 근거: `server/platform/shared/mail/mail.go` (`net.Dialer{Timeout: ...}`)

### 3-3) Site Configuration > Notifications

핵심 요약:
- 이 구간은 "메일을 보낼지"와 "받는 사람이 보게 될 발신자 정보"를 결정합니다.

- `EmailSettings.SendEmailNotifications`
  - 값 의미: 포스트 기반 이메일 알림(멘션/DM/스레드) 전체 on/off
  - 영향: `false`이면 포스트 알림 루프 비활성화
  - 권장: 운영 환경에서는 `true`
  - 주의: 계정 메일(인증/재설정)과 포스트 알림은 체감 동작이 다를 수 있으므로 분리 검증 필요
  - 확인법: 멘션/DM 알림과 재설정 메일을 각각 개별 테스트
  - 코드 근거: `server/channels/app/notification.go` (`if *a.Config().EmailSettings.SendEmailNotifications { ... }`)

- `EmailSettings.FeedbackName`
  - 값 의미: 메일 헤더 표시 이름(발신자 Display Name)
  - 영향: 수신함에서 보이는 발신자 이름 품질/신뢰도에 영향
  - 권장: 서비스명 + 목적이 드러나는 값(예: `OKR.BEST Notification`)
  - 주의: 조직 내 다른 시스템과 이름이 충돌하면 피싱 오해 가능
  - 확인법: 실제 수신함(웹/모바일)에서 표시명 확인

- `EmailSettings.FeedbackEmail`
  - 값 의미: From 주소
  - 영향: 도메인 정책(SPF/DKIM/DMARC) 불일치 시 스팸 분류/거부 가능
  - 권장: 실제 발송 권한이 있는 조직 도메인 주소 사용
  - 주의: Google Allowed senders 정책/SES 도메인 검증과 반드시 정합성 필요
  - 확인법: 수신 메일 헤더의 SPF/DKIM pass 여부 확인
  - 코드 근거: `server/platform/shared/mail/mail.go` (`fromMail := mail.Address{...}`)

- `EmailSettings.ReplyToAddress`
  - 값 의미: Reply-To 주소
  - 영향: 사용자가 메일 답장 시 실제 회신되는 주소
  - 권장:
    - 회신 비허용: `noreply@...`
    - 회신 허용: 운영/지원 메일함 주소
  - 주의: Reply-To를 운영 메일함으로 두면 예상 외 문의량 급증 가능
  - 확인법: 테스트 메일에 답장하여 실제 수신 경로 확인
  - 코드 근거: `server/platform/shared/mail/mail.go` (`replyTo := mail.Address{...}`)

- `EmailSettings.EmailNotificationContentsType` (`full` / `generic`)
  - 값 의미: 알림 메일 본문 노출 수준
  - 영향:
    - `full`: 메시지/채널 맥락 포함
    - `generic`: 발신자 중심의 축약 정보
  - 권장:
    - 보안/컴플라이언스 우선 조직: `generic`
    - 사용자 편의 우선 조직: `full`
  - 주의: 모바일 잠금화면/메일 미리보기 정책과 함께 검토 필요
  - 확인법: 동일 이벤트를 `full`/`generic`로 각각 수신해 본문 노출 범위 비교

## 4) 필수/권장/선택 설정 구분

### 4-1) 필수(운영 최소 조건)

- `SMTPServer`
- `SMTPPort`
- `ConnectionSecurity` (권장값은 아래 참고)
- `SendEmailNotifications=true` (포스트 알림 운영 시)
- `FeedbackName`, `FeedbackEmail`, `ReplyToAddress`

### 4-2) 권장(보안/운영 안정성)

- `ConnectionSecurity=TLS` 또는 `STARTTLS`
- `SMTPServerTimeout` 명시(기본 10초, 환경에 맞게 조정)
- `RequireEmailVerification=true` (운영 정책에 따라)
- SPF/DKIM/DMARC 정비된 발신 도메인 사용

### 4-3) 선택(진단/특수 상황)

- `SkipServerCertificateVerification=true`
  - 임시 장애 진단 목적으로만 사용
  - 원인 확인 후 즉시 `false`로 원복

## 5) 운영/개발 권장 조합

### 5-1) 운영(Production)

- `SendEmailNotifications=true`
- `ConnectionSecurity=TLS` 또는 `STARTTLS`
- `EnableSMTPAuth=true`(SMTP 공급자 정책에 맞춤)
- `RequireEmailVerification=true` 권장
- `SkipServerCertificateVerification=false`

### 5-2) 개발(Dev)

- 빠른 로컬 개발 목적이면 `SendEmailNotifications=false` 고려 가능
- 단, 비밀번호 재설정/이메일 인증 플로우 테스트 시에는 실제 SMTP 연동 필요

## 6) 코드 기준 실제 동작(중요)

### 6-1) SMTP 런타임 매핑

서버는 `EmailSettings`를 SMTP 런타임 설정으로 변환해 사용합니다.
- 서버/포트/보안/인증/타임아웃/발신 헤더가 모두 `MailServiceConfig`로 매핑됩니다.

### 6-2) 보안 모드 동작

- `TLS`: 연결 시작부터 TLS
- `STARTTLS`: 평문 연결 후 TLS 업그레이드
- `""`: 암호화 업그레이드 없음

### 6-3) 인증 동작

- `EnableSMTPAuth=true`일 때만 SMTP AUTH 수행
- 보안 연결 없는 인증은 서버 정책상 실패 가능성이 큽니다.

### 6-4) 포스트 알림 이메일 발송 조건

전역 조건:
- `SendEmailNotifications=true`

사용자별 조건:
- 봇/원격 사용자 아님
- 개인/채널 알림 설정에서 이메일 허용
- 채널 mute 아님
- 상태값이 `online`, `dnd`가 아님
- 계정 삭제 상태 아님
- 자동응답 관련 상태 아님
- `RequireEmailVerification=true`인 경우 이메일 인증 완료

## 7) Google Workspace SMTP Relay 연동 가이드

## 7-1) 언제 SMTP Relay를 쓰는가

다음 상황에서 Google SMTP Relay가 적합합니다.
- 온프렘/사내 앱(Mattermost 포함)에서 대외 발신 메일을 Google 경유로 통합
- Gmail 보안/라우팅 정책을 발신 메일에 적용하고 싶을 때
- 사용자 개인 Gmail SMTP 계정이 아니라 서비스/서버 단위 발신을 운영할 때

주의:
- Google 문서 기준, SMTP Relay를 Gmail 발신 메일의 재중계 루프 용도로 쓰는 것은 권장되지 않습니다.
- Google Workspace는 과거 less secure app 방식이 중단되었으므로 인증 방식 정책을 사전에 검토해야 합니다.

## 7-2) Google Admin Console 설정 경로

- `Apps > Google Workspace > Gmail > Routing > SMTP relay service`

설정은 상위 조직(Top-level organization) 기준으로 관리됩니다.

## 7-3) Allowed senders 옵션 선택 기준

- `Only registered Apps users in my domains`
  - 의미: 발신자가 실제 Google Workspace 사용자여야 함
  - 장점: 계정 기반 추적/통제가 가장 명확
  - 리스크/제약: 앱 전용 주소(비사용자 계정) 사용이 불편할 수 있음
  - 권장 시나리오: 사용자 단위 발신 거버넌스가 엄격한 조직
- `Only addresses in my domains`
  - 의미: 발신자가 사용자 계정일 필요는 없지만, 발신 주소 도메인은 내 도메인이어야 함
  - 장점: 시스템/서비스 계정 발신에 유연
  - 리스크/제약: 도메인 관리가 느슨하면 오발신 가능성 증가
  - 권장 시나리오: Mattermost 같은 시스템 알림 발신
- `Any addresses` (비권장)
  - 의미: 임의 도메인 주소도 발신 허용
  - 장점: 레거시 마이그레이션 시 단기 유연성
  - 리스크/제약: 오남용/스푸핑 위험이 가장 큼
  - 운영 권장: 가급적 사용 금지, 불가피하면 SMTP AUTH + 엄격한 EHLO/HELO 정책 병행

## 7-4) Authentication 옵션 설계

- `Only accept mail from the specified IP addresses`
  - 의미: 공인 IP allowlist 기반 인증
  - 장점: 단순하고 안정적, 앱 비밀번호 관리 부담 감소
  - 리스크/제약: IP 변경 시 즉시 장애 가능
  - 권장 시나리오: 고정 공인 IP를 가진 서버
- `Require SMTP Authentication`
  - 의미: 계정/비밀번호 기반 SMTP AUTH
  - 장점: IP 고정 없이도 제어 가능
  - 리스크/제약: 자격증명 관리/회전 정책이 필수, TLS 전제
  - 권장 시나리오: 오토스케일/가변 IP 환경
- 둘 다 사용
  - 의미: 네트워크(소스 IP) + 계정(자격증명) 이중 통제
  - 장점: 보안 강도 상승
  - 리스크/제약: 운영 복잡도 증가
  - 권장 시나리오: 보안 통제가 엄격한 조직

## 7-5) Encryption(Require TLS) 영향

- Google 측에서 `Require TLS`를 켜면, TLS 미사용 연결은 거부됩니다.
- Mattermost에서는 일반적으로 `ConnectionSecurity=STARTTLS`와 `SMTPPort=587` 조합이 Google relay와 잘 맞습니다.
- 운영 권장:
  - Google에서 `Require TLS=true`면 Mattermost도 반드시 TLS 계열(`STARTTLS` 또는 `TLS`)로 일치
  - 장애 대응 시에도 TLS 해제보다 인증서/중간장비 이슈를 먼저 점검

## 7-6) Google relay 접속값(문서 기준)

- 호스트: `smtp-relay.gmail.com`
- TLS 사용 시 권장 포트: `587`
- 비TLS 시 `25/465/587`도 언급되지만, 보안/정책상 운영에서는 TLS 사용을 권장

## 7-7) 송신 한도(운영 영향)

Google 문서 기준 주요 제한:
- 조직 전체 24시간 총 수신자 한도
- 10분 구간 총 수신자 한도
- 사용자당 24시간 메시지 한도(예: 10,000)
- SMTP 트랜잭션당 수신자 100명 제한

실무 영향:
- 대량 알림/공지 메일 배치 시 rate control 설계 필요
- 수신자를 분할하여 여러 트랜잭션으로 전송해야 할 수 있음
- 사용자별/조직별 한도는 별도로 걸리므로, 둘 중 하나만 초과해도 발송 실패 가능
- Trial/미납 상태에서는 한도가 더 낮아질 수 있어 사전 점검 필요

## 7-8) null envelope sender 제약

Google relay는 `MAIL FROM: <>`(null envelope sender) 사용 시 제약이 있습니다.
- 특히 여러 `RCPT TO`와 결합되는 경우 제약이 발생할 수 있으므로 bounce/auto-reply 계열 시스템과 함께 운영 시 사전 테스트가 필요합니다.
- 운영 권장:
  - 자동응답/반송 처리 시스템은 프로덕션 반영 전 별도 시나리오 테스트
  - EHLO/HELO에 조직 도메인을 명시해 식별성을 높이는 구성을 권장

## 8) Google 연동 실전 템플릿

### 8-1) 시나리오 A: TLS + IP allowlist

권장 대상:
- 고정 공인 IP를 가진 서버
- 계정 기반 SMTP AUTH를 최소화하고 싶은 조직

Mattermost `config.json` 예시:

```json
{
  "EmailSettings": {
    "SendEmailNotifications": true,
    "FeedbackName": "OKR.BEST Notification",
    "FeedbackEmail": "mattermost@your-domain.com",
    "ReplyToAddress": "noreply@your-domain.com",
    "SMTPServer": "smtp-relay.gmail.com",
    "SMTPPort": "587",
    "ConnectionSecurity": "STARTTLS",
    "EnableSMTPAuth": false,
    "SMTPUsername": "",
    "SMTPPassword": "",
    "SkipServerCertificateVerification": false,
    "SMTPServerTimeout": 10
  }
}
```

환경변수 예시:

```bash
MM_EMAILSETTINGS_SMTPSERVER=smtp-relay.gmail.com
MM_EMAILSETTINGS_SMTPPORT=587
MM_EMAILSETTINGS_CONNECTIONSECURITY=STARTTLS
MM_EMAILSETTINGS_ENABLESMTPAUTH=false
MM_EMAILSETTINGS_SENDEMAILNOTIFICATIONS=true
MM_EMAILSETTINGS_FEEDBACKNAME="OKR.BEST Notification"
MM_EMAILSETTINGS_FEEDBACKEMAIL=mattermost@your-domain.com
MM_EMAILSETTINGS_REPLYTOADDRESS=noreply@your-domain.com
```

Postfix 예시:

```ini
relayhost = [smtp-relay.gmail.com]:587
smtp_use_tls = yes
smtp_tls_security_level = may
smtp_helo_name = mail.your-domain.com
```

핵심 값 해설:
- `relayhost`: Google relay로 모든 외부 발신 경로를 고정
- `smtp_tls_security_level=may`: TLS 가능 시 사용(보안 요구가 높으면 `encrypt` 검토)
- `smtp_helo_name`: `localhost` 대신 조직 도메인 기반 식별자 사용 권장

### 8-2) 시나리오 B: TLS + SMTP AUTH

권장 대상:
- IP 고정이 어렵거나
- 사용자/계정 기반 감사 추적이 필요한 조직

Mattermost `config.json` 예시:

```json
{
  "EmailSettings": {
    "SendEmailNotifications": true,
    "FeedbackName": "OKR.BEST Notification",
    "FeedbackEmail": "mattermost@your-domain.com",
    "ReplyToAddress": "noreply@your-domain.com",
    "SMTPServer": "smtp-relay.gmail.com",
    "SMTPPort": "587",
    "ConnectionSecurity": "STARTTLS",
    "EnableSMTPAuth": true,
    "SMTPUsername": "smtp-relay-user@your-domain.com",
    "SMTPPassword": "APP_OR_RELAY_CREDENTIAL",
    "SkipServerCertificateVerification": false,
    "SMTPServerTimeout": 10
  }
}
```

환경변수 예시:

```bash
MM_EMAILSETTINGS_SMTPSERVER=smtp-relay.gmail.com
MM_EMAILSETTINGS_SMTPPORT=587
MM_EMAILSETTINGS_CONNECTIONSECURITY=STARTTLS
MM_EMAILSETTINGS_ENABLESMTPAUTH=true
MM_EMAILSETTINGS_SMTPUSERNAME=smtp-relay-user@your-domain.com
MM_EMAILSETTINGS_SMTPPASSWORD=APP_OR_RELAY_CREDENTIAL
MM_EMAILSETTINGS_SENDEMAILNOTIFICATIONS=true
MM_EMAILSETTINGS_FEEDBACKEMAIL=mattermost@your-domain.com
```

Postfix 예시:

```ini
relayhost = [smtp-relay.gmail.com]:587
smtp_use_tls = yes
smtp_tls_security_level = encrypt
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_helo_name = mail.your-domain.com
```

핵심 값 해설:
- `smtp_sasl_auth_enable=yes`: AUTH 기반 릴레이 활성화
- `smtp_sasl_password_maps`: 자격증명 저장 위치(권한 600 + 접근 통제 필수)
- `smtp_tls_security_level=encrypt`: TLS 없으면 전송하지 않음(Require TLS 정책과 정합)

주의:
- Google 정책상 SMTP AUTH와 TLS 요구사항을 함께 만족해야 합니다.
- 인증정보는 평문 파일 커밋 금지, 비밀 저장소 사용 권장입니다.

## 9) AWS SES로 SMTP 구성하기

핵심 요약:
- Mattermost 공식 문서 기준으로 AWS SMTP는 **Amazon SES**를 권장 시나리오로 사용합니다.
- 실무 흐름은 `SES 준비 -> Mattermost 입력 -> 테스트 -> 운영 점검` 순서가 가장 안전합니다.

### 9-1) SES 사전 준비 (AWS 콘솔)

1. AWS Console에서 Amazon SES로 이동
2. `SMTP Settings > Create My SMTP Credentials` 실행
3. 아래 4개 값을 확보
   - `Server Name`
   - `Port`
   - `SMTP Username`
   - `SMTP Password`
4. `Domains` 메뉴에서 발신 도메인 검증(Verify)
5. `Generate DKIM Settings` 활성화
6. DNS에 SPF/DKIM 반영 후 전파 확인
7. 발신 주소 예시(`mattermost@your-domain.com`)를 지정하고 테스트 메일 점검

운영 권장:
- SES SMTP 자격증명은 사람 계정과 분리된 전용 자격증명 사용
- 도메인 검증/DKIM/SPF 완료 전에는 전달률이 떨어질 수 있음

### 9-2) Mattermost 설정 매핑 (SES 기준)

공식 샘플값(문서 기준):
- `SMTP Server`: `email-smtp.us-east-1.amazonaws.com` (리전에 맞춰 변경)
- `SMTP Port`: `"465"`
- `Connection Security`: `TLS`

적용 순서:
1. `System Console > Authentication > Email`
   - 이메일 가입/로그인/인증 정책 설정
2. `System Console > Environment > SMTP`
   - `SMTPServer`, `SMTPPort`, `ConnectionSecurity`, `EnableSMTPAuth`, `SMTPUsername`, `SMTPPassword` 입력
3. `System Console > Site Configuration > Notifications`
   - `SendEmailNotifications=true`
   - `FeedbackName`, `FeedbackEmail`, `ReplyToAddress` 입력
4. 저장 후 `Test Connection` 실행

주의:
- `SMTPPort`는 문자열 포맷(`"465"`) 사용
- `SMTPUsername`/`SMTPPassword`를 입력했다면 보안 모드는 반드시 `TLS` 또는 `STARTTLS`

### 9-3) SES 전용 템플릿 (`config.json`)

```json
{
  "EmailSettings": {
    "SendEmailNotifications": true,
    "FeedbackName": "OKR.BEST Notification",
    "FeedbackEmail": "mattermost@your-domain.com",
    "ReplyToAddress": "noreply@your-domain.com",
    "SMTPServer": "email-smtp.ap-northeast-2.amazonaws.com",
    "SMTPPort": "465",
    "ConnectionSecurity": "TLS",
    "EnableSMTPAuth": true,
    "SMTPUsername": "SES_SMTP_USERNAME",
    "SMTPPassword": "SES_SMTP_PASSWORD",
    "SkipServerCertificateVerification": false,
    "SMTPServerTimeout": 10
  }
}
```

값 해설:
- `SMTPServer`: SES 리전 엔드포인트와 반드시 일치
- `SMTPPort="465"` + `ConnectionSecurity="TLS"`: 공식 문서의 SES 샘플 조합
- `EnableSMTPAuth=true`: SES SMTP는 자격증명 인증 기반이 기본

### 9-4) SES 전용 템플릿 (환경변수)

```bash
MM_EMAILSETTINGS_SMTPSERVER=email-smtp.ap-northeast-2.amazonaws.com
MM_EMAILSETTINGS_SMTPPORT=465
MM_EMAILSETTINGS_CONNECTIONSECURITY=TLS
MM_EMAILSETTINGS_ENABLESMTPAUTH=true
MM_EMAILSETTINGS_SMTPUSERNAME=SES_SMTP_USERNAME
MM_EMAILSETTINGS_SMTPPASSWORD=SES_SMTP_PASSWORD
MM_EMAILSETTINGS_SENDEMAILNOTIFICATIONS=true
MM_EMAILSETTINGS_FEEDBACKNAME="OKR.BEST Notification"
MM_EMAILSETTINGS_FEEDBACKEMAIL=mattermost@your-domain.com
MM_EMAILSETTINGS_REPLYTOADDRESS=noreply@your-domain.com
```

운영 권장:
- 비밀번호는 `.env` 평문 고정 대신 시크릿 매니저/배포 시 주입 방식 사용
- 자격증명 교체(로테이션) 절차를 운영 문서로 별도 관리

### 9-5) AWS/SES 운영 시 추가 점검

- SES 샌드박스 상태 확인
  - 샌드박스에서는 발신/수신 제한이 있어 테스트 계정 외 전송이 제한될 수 있음
- 반송/컴플레인 지표 모니터링
  - 전달률 저하/차단 징후를 조기에 감지
- 네트워크 정책 점검
  - 인스턴스 보안그룹/NACL/방화벽에서 SMTP 아웃바운드 허용 확인

### 9-6) Docker 환경 주의사항 (공식 문서 기반)

- Docker 배포에서 메일 릴레이 접근 오류가 발생하면 네트워크 대역 정책을 점검합니다.
- 공식 문서 예시로는 `192.168.0.0/24` 대역 허용과 postfix `mynetworks` 설정을 안내합니다.
- 실제 환경의 컨테이너 네트워크 대역에 맞춰 릴레이 허용 목록을 조정해야 합니다.

## 10) 적용 절차 (공통 -> 공급자별)

### 10-1) 공통 적용 절차

1. `Authentication > Email`에서 계정 정책 확정
   - `EnableSignUpWithEmail`, `RequireEmailVerification`, `EnableSignInWithEmail`, `EnableSignInWithUsername`
2. SMTP 공급자 결정
   - Google Workspace Relay 또는 AWS SES
3. `Environment > SMTP` 입력
   - `SMTPServer`, `SMTPPort`, `ConnectionSecurity`, `EnableSMTPAuth`, `SMTPUsername`, `SMTPPassword`
4. `Site Configuration > Notifications` 입력
   - `SendEmailNotifications=true`, `FeedbackName`, `FeedbackEmail`, `ReplyToAddress`
5. `Test Connection` 실행 후 테스트 메일 수신 확인
6. 실제 사용자 시나리오 검증
   - 멘션/DM/스레드, 비밀번호 재설정, 이메일 인증

### 10-2) Google Workspace Relay 적용 절차

1. Google Admin Console에서 SMTP relay rule 생성
2. `Allowed senders`, `Authentication`, `Require TLS` 정책 결정
3. Google 설정 저장 후 전파 확인(환경에 따라 지연 가능)
4. Mattermost에 Google relay 값 반영
   - 일반 권장: `SMTPServer=smtp-relay.gmail.com`, `SMTPPort="587"`, `ConnectionSecurity=STARTTLS`
5. 정책 정합성 점검
   - `FeedbackEmail` 도메인, 송신 IP allowlist, EHLO/HELO 식별자

### 10-3) AWS SES 적용 절차

1. SES에서 `SMTP Settings > Create My SMTP Credentials` 실행
2. `Server Name`, `Port`, `SMTP Username`, `SMTP Password` 확보
3. 도메인 검증 + DKIM 활성화 + SPF/DKIM 반영
4. Mattermost에 SES 값 반영
   - 문서 샘플: `SMTPServer=email-smtp.<region>.amazonaws.com`, `SMTPPort="465"`, `ConnectionSecurity=TLS`
5. SES 운영 상태 점검
   - 샌드박스 여부, 송신 제한, 반송/컴플레인 지표

## 11) 검증 절차 (공통 -> 공급자별)

### 11-1) 공통 검증

- `Test Connection` 성공 여부 확인
- 실제 수신함에서 테스트 메일 수신 확인
- 멘션/DM/스레드 알림 메일 수신 확인
- 비밀번호 재설정/이메일 인증 메일 플로우 확인
- 정책 검증
  - `online`/`dnd` 억제, 채널 mute, 개인 알림 설정, 이메일 인증 상태

### 11-2) Google 전용 검증

- `Require TLS` 활성화 시 Mattermost도 TLS 계열(`STARTTLS`/`TLS`)인지 확인
- Allowed senders 정책과 `FeedbackEmail` 발신 도메인 일치 확인
- IP allowlist 방식이면 실제 송신 공인 IP 일치 확인
- 대량 발송 시 Google relay 한도(조직/사용자/트랜잭션) 기반 배치 전송 검증

### 11-3) AWS SES 전용 검증

- SES 리전 엔드포인트와 설정값 일치 확인
- `SMTPPort="465"` + `ConnectionSecurity=TLS` 조합으로 연결 확인
- SES SMTP 자격증명으로 인증 성공 확인
- 샌드박스 계정이면 허용된 발신/수신 대상만 테스트되는지 확인

## 12) 트러블슈팅 (공통 -> 공급자별)

### 12-1) 공통

#### `authentication failed`

- `EnableSMTPAuth=true` 여부 확인
- `SMTPUsername`/`SMTPPassword` 오타 및 최신값 반영 여부 확인
- 보안 모드가 `TLS` 또는 `STARTTLS`인지 확인

#### TLS/STARTTLS 실패

- 포트/보안모드 조합 확인 (`587+STARTTLS`, `465+TLS`)
- 중간 프록시/보안장비의 TLS 차단/변조 여부 확인
- 인증서 이슈 진단 시 `SkipServerCertificateVerification=true`는 임시로만 사용 후 즉시 원복

#### 테스트는 성공인데 실사용에서 미수신

- `SendEmailNotifications=true` 확인
- 수신자 상태(`online`, `dnd`)와 mute/개인 알림 설정 확인
- `RequireEmailVerification=true`일 때 수신자 이메일 인증 상태 확인

### 12-2) Google 전용

- 릴레이 거부/정책 불일치:
  - Allowed senders 정책과 발신 주소 정합성 확인
  - IP allowlist 구성 시 송신 서버 공인 IP 변경 여부 확인
- `Client host rejected: Access denied`:
  - 공식 문서 예시 오류 기준으로 `System Console > Logs`와 동시간대 상관 분석
  - SMTP 릴레이 서비스 측 네트워크 정책, 방화벽, 프록시 차단 여부 순차 점검
- 대량 발송 지연/누락:
  - 조직/사용자/트랜잭션 한도 초과 여부 확인 후 배치 크기 축소

### 12-3) AWS SES 전용

- 인증 실패:
  - SES SMTP 자격증명과 IAM 콘솔 로그인 자격증명 혼용 여부 확인
  - 최근 자격증명 로테이션 후 반영 누락 여부 확인
- 연결 실패:
  - SES 엔드포인트 리전과 자격증명 생성 리전 일치 확인
  - 보안그룹/NACL/방화벽 아웃바운드 SMTP 포트 허용 여부 확인
- 전달률 저하:
  - 샌드박스 제한, 반송률/컴플레인 지표 상승 여부 점검

## 13) 운영 체크리스트 (공통 -> 공급자별)

### 13-1) 공통

- [ ] Mattermost SMTP/Notifications 설정 저장 완료
- [ ] `Test Connection` 성공 + 실제 수신함 확인
- [ ] 멘션/DM/재설정/인증 메일 검증 완료
- [ ] SPF/DKIM/DMARC 검증 완료
- [ ] 인증정보 비밀관리(시크릿 매니저/권한 통제) 적용

### 13-2) Google 전용

- [ ] Google SMTP relay 정책(Allowed senders/Auth/TLS) 확정
- [ ] 송신 서버 공인 IP 확인 및 allowlist 반영
- [ ] Google relay 송신 한도 기반 배치/모니터링 전략 수립

### 13-3) AWS SES 전용

- [ ] SES 도메인 검증 + DKIM/SPF 반영 완료
- [ ] SES 샌드박스 여부 및 송신 한도 확인
- [ ] SES 자격증명 로테이션 주기/절차 수립

## 14) 코드 근거와 런타임 흐름

- 설정 모델/기본값/검증: `server/public/model/config.go`
- SMTP 런타임 매핑: `server/channels/app/config.go`
- 포스트 알림 발송 조건: `server/channels/app/notification.go`
- 테스트 메일 API: `server/channels/api4/system.go`, `server/channels/app/admin.go`
- SMTP 연결/인증/보안: `server/platform/shared/mail/mail.go`
- 콘솔 설정 키 정의: `webapp/channels/src/components/admin_console/admin_definition.tsx`

실행 흐름 요약:
1. 관리자가 System Console에서 `EmailSettings` 저장
2. 서버가 설정을 `SMTPConfig`로 매핑
3. `Test Connection` 또는 실제 알림 이벤트에서 SMTP 연결/인증 수행
4. 사용자별 알림 조건을 통과한 대상에게만 메일 전송
