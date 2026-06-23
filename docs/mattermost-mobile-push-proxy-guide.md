# Mattermost 모바일 푸시 프록시(MPNS) 자체 호스팅 가이드

참고 문서:
- [Host your own push proxy service](https://docs.mattermost.com/deployment-guide/mobile/host-your-own-push-proxy-service.html)
- [Install the Mattermost push notification service](https://developers.mattermost.com/contribute/more-info/mobile/push-notifications/service/)

## 1) 개요

커스텀 Mattermost 모바일 앱을 운영하는 경우, 기본 푸시 서비스 대신 **자체 호스팅 MPNS(Mattermost Push Notification Service)** 를 구성해야 합니다.

- 역할: Mattermost 서버가 생성한 푸시 이벤트를 받아 APNS(iOS), FCM(Android)로 전달
- 특징: 모바일 앱이 MPNS에 직접 붙는 구조가 아니라, **Mattermost 서버 -> MPNS -> APNS/FCM -> 모바일 앱** 흐름
- 목적: 커스텀 앱 푸시 지원, 보안/망분리 정책 대응, 운영 통제 강화

## 2) 아키텍처와 통신 경로

### 기본 흐름

1. 사용자 멘션/DM/알림 이벤트 발생
2. Mattermost 서버가 MPNS로 푸시 요청 전송
3. MPNS가 APNS 또는 FCM으로 전달
4. 모바일 기기에서 푸시 수신
5. 앱이 필요 시 서버에서 메시지 본문/상세 조회

### 네트워크 요구사항

- Mattermost 서버에서 MPNS로 접근 가능해야 함
- MPNS에서 APNS/FCM으로 아웃바운드 통신 가능해야 함
- APNS 경로는 **HTTP/2** 지원 필수
- 중간 프록시 장비를 두는 경우 APNS HTTP/2 통과 가능 여부 확인 필요
- Mattermost 서버와 MPNS 사이 TLS 적용 권장

## 3) 사전 준비물

### 공통

- Linux 또는 FreeBSD 서버(문서 기준 최소 1GB 메모리)
- MPNS 바이너리(직접 빌드 또는 GitHub 릴리스)
- 운영 계정(권장: 최소권한 전용 계정)
- `mattermost-push-proxy.json` 설정 파일 관리 계획

### Android(FCM)

- Firebase 프로젝트
- Service Account JSON 키 파일
- MPNS 설정의 `AndroidPushSettings.ServiceFileLocation`에 파일 경로 지정

### iOS(APNS)

- APNs Auth Key(`.p8`)
- `ApplePushTopic`(앱 번들 ID)
- `AppleAuthKeyID`
- `AppleTeamID`
- 개발/운영 여부에 맞는 `ApplePushUseDevelopment` 값

## 4) MPNS 설치 및 서비스 등록

아래 예시는 Linux 기준이며, FreeBSD도 동일한 개념으로 진행합니다.

### 1. MPNS 다운로드

```bash
wget https://github.com/mattermost/mattermost-push-proxy/releases/download/vX.X.X/mattermost-push-proxy-linux-amd64.tar.gz
```

업그레이드 상황이면 먼저 기존 설정 파일(`mattermost-push-proxy.json`)을 백업합니다.

### 2. 압축 해제

```bash
tar -xvzf mattermost-push-proxy-linux-amd64.tar.gz
```

### 3. 설정 파일 편집

일반적으로 `config/mattermost-push-proxy.json`을 편집합니다.

### 4. systemd 서비스 등록(권장)

문서 예시처럼 서비스 파일을 구성하여 부팅 시 자동 실행/재시작이 가능하도록 설정합니다.

```bash
sudo systemctl daemon-reload
sudo systemctl enable mattermost-push-proxy
sudo systemctl restart mattermost-push-proxy
sudo systemctl status mattermost-push-proxy
```

프록시 경유가 필요한 환경은 서비스 파일에 `HTTP_PROXY` 또는 `HTTPS_PROXY` 환경변수를 추가합니다.

## 5) Android 푸시 설정(FCM)

1. Firebase Console에서 대상 프로젝트 선택
2. 프로젝트 설정 -> Service Accounts 이동
3. 새 private key(JSON) 생성
4. MPNS 설정 파일의 Android 항목에 경로 지정

예시:

```json
"AndroidPushSettings": {
  "ServiceFileLocation": "/path/to/fcm-service-account.json"
}
```

점검 포인트:
- 파일 경로 오타 여부
- MPNS 실행 계정의 파일 읽기 권한
- 키 파일 교체/만료 시 재배포 절차 준비

### 5-1) Firebase 프로젝트 준비 절차(상세)

1. [Firebase Console](https://console.firebase.google.com/)에서 푸시 전용 또는 앱 전용 프로젝트를 생성합니다.
2. Android 앱의 패키지명(`applicationId`)을 Firebase 앱 등록 시 동일하게 입력합니다.
3. 팀 운영 시 프로젝트 권한(Owner/Editor)을 최소 인원에게만 부여합니다.

권장:
- 개발/운영 Firebase 프로젝트를 분리해 잘못된 발송을 방지합니다.
- 프로젝트 이름에 `-dev`, `-prod`를 명확히 붙입니다.

### 5-2) Service Account 키 발급 및 보관

1. Firebase Console -> 프로젝트 설정 -> **Service Accounts**
2. **Generate new private key** 클릭
3. 다운로드한 JSON 파일을 MPNS 서버의 안전한 경로에 저장
4. 파일 권한 최소화

예시:

```bash
sudo mkdir -p /opt/mattermost-push-proxy/config/keys
sudo mv ~/Downloads/<firebase-key>.json /opt/mattermost-push-proxy/config/keys/fcm-service-account.json
sudo chown mattermost-push-proxy:mattermost-push-proxy /opt/mattermost-push-proxy/config/keys/fcm-service-account.json
sudo chmod 600 /opt/mattermost-push-proxy/config/keys/fcm-service-account.json
```

주의:
- JSON 키는 재다운로드가 불가능한 경우가 많으므로, 발급 즉시 비밀관리체계(예: Vault, KMS, 암호화 저장소)에 보관합니다.
- Git 저장소에 절대 커밋하지 않습니다.

### 5-3) MPNS 설정 매핑(Android)

`mattermost-push-proxy.json`의 Android 설정은 최소 아래가 필요합니다.

```json
"AndroidPushSettings": {
  "ServiceFileLocation": "/opt/mattermost-push-proxy/config/keys/fcm-service-account.json"
}
```

검증 순서:
1. 경로 존재 여부 확인
2. MPNS 실행 계정의 읽기 권한 확인
3. JSON 형식 유효성 확인(`jq . <file>`)
4. MPNS 재시작 후 오류 로그 확인

### 5-4) Android 앱 측 필수 조건

- 앱에 Firebase 설정(`google-services.json`)이 올바르게 포함되어야 합니다.
- 앱 패키지명과 Firebase 등록 정보가 일치해야 합니다.
- 사용자 디바이스에서 알림 권한이 허용되어야 합니다(Android 13+ 런타임 권한 포함).
- 앱이 실제로 FCM 토큰을 발급받아 Mattermost 세션에 등록해야 합니다.

### 5-5) Android 실패 시 빠른 진단 체크리스트

- MPNS 로그에 FCM 인증/전송 오류가 있는지 확인
- Firebase 프로젝트/키 파일이 운영 앱 기준인지 확인
- 디바이스 토큰이 최신인지 확인(재로그인/앱 재설치 후 갱신 가능)
- 테스트 계정의 모바일 알림 설정이 활성화되어 있는지 확인
- 프록시 환경이면 `fcm.googleapis.com` 도달성 점검

## 6) iOS 푸시 설정(APNS, p8 권장)

문서 기준 권장 방식은 인증서 방식보다 APNs Auth Key(`.p8`) 방식입니다.

예시:

```json
"ApplePushSettings": [
  {
    "Type": "apple_rn",
    "ApplePushUseDevelopment": true,
    "ApplePushTopic": "your.bundle.id",
    "AppleAuthKeyFile": "./config/beta/YourAuthKeyFile.p8",
    "AppleAuthKeyID": "YourAuthKeyID",
    "AppleTeamID": "YourAppleTeamID"
  }
]
```

필드 설명:
- `ApplePushTopic`: 앱 번들 ID와 정확히 일치해야 함
- `AppleAuthKeyFile`: `.p8` 파일 경로
- `AppleAuthKeyID`: Apple Developer의 키 ID
- `AppleTeamID`: Apple Developer Team ID
- `ApplePushUseDevelopment`: 개발(sandbox)=`true`, 운영= `false`

### 6-1) Apple Developer 사전 준비

1. Apple Developer 계정에서 대상 App ID(번들 ID)를 확인/생성합니다.
2. 해당 App ID에 **Push Notifications** Capability를 활성화합니다.
3. 앱 빌드(개발/운영)에 사용 중인 번들 ID가 MPNS 설정의 `ApplePushTopic`과 완전히 동일한지 확인합니다.

핵심:
- iOS 푸시는 번들 ID, 팀 ID, 키 ID 조합이 맞아야 정상 동작합니다.

### 6-2) APNs Auth Key(.p8) 생성 절차

1. Apple Developer -> Certificates, Identifiers & Profiles -> **Keys**
2. 새 Key 생성 후 APNs 권한을 활성화
3. `.p8` 파일 다운로드(한 번만 가능)
4. 생성된 Key의 **Key ID** 기록
5. 계정의 **Team ID** 확인

운영 권장:
- 개발/운영 분리 정책이 있다면 키 사용 정책을 문서화합니다.
- `.p8`는 민감 정보이므로 접근 제어 및 감사 로그를 적용합니다.

### 6-3) MPNS 설정 매핑(iOS)

```json
"ApplePushSettings": [
  {
    "Type": "apple_rn",
    "ApplePushUseDevelopment": false,
    "ApplePushTopic": "com.example.myapp",
    "AppleAuthKeyFile": "/opt/mattermost-push-proxy/config/keys/AuthKey_XXXXXXXXXX.p8",
    "AppleAuthKeyID": "XXXXXXXXXX",
    "AppleTeamID": "YYYYYYYYYY"
  }
]
```

매핑 기준:
- `ApplePushTopic`: iOS 앱 번들 ID
- `AppleAuthKeyFile`: `.p8` 절대 경로
- `AppleAuthKeyID`: APNs Key ID
- `AppleTeamID`: Apple Team ID
- `ApplePushUseDevelopment`: TestFlight/스토어 빌드 기준 운영은 보통 `false`

### 6-4) iOS 앱 측 필수 조건

- Xcode 프로젝트에서 Push Notifications capability 활성화
- 필요 시 Background Modes(원격 알림 관련) 설정 확인
- 앱이 APNs 디바이스 토큰을 정상 수집/전달하는지 확인
- 사용자 단말에서 알림 권한 허용 여부 확인

### 6-5) 개발/운영 APNS 환경 구분

- `ApplePushUseDevelopment=true`: 개발/디버그(sandbox) 환경
- `ApplePushUseDevelopment=false`: 운영(production) 환경

실무 원칙:
- 앱 빌드 타입과 MPNS 값을 반드시 짝으로 관리합니다.
- 배포 파이프라인에서 `dev/prod` 설정이 섞이지 않도록 별도 설정 파일을 유지합니다.

### 6-6) iOS 실패 시 빠른 진단 체크리스트

- `DeviceTokenNotForTopic` 발생 시:
  - `ApplePushTopic`과 실제 번들 ID 비교
  - 오래된 device token 사용 여부 확인
  - 개발/운영 모드 불일치 여부 확인
- `.p8` 경로/권한/파일 손상 여부 확인
- `AppleAuthKeyID`, `AppleTeamID` 오기입 여부 확인
- 프록시 환경이면 APNS HTTP/2 통신 가능 여부 재검증

## 7) Mattermost 서버 설정

System Console에서 자체 MPNS를 사용하도록 설정합니다.

1. **Push Notification Server** 관련 설정으로 이동
2. **Manually enter Push Notification Service location** 선택
3. 자체 MPNS URL 입력 후 저장

추가로 푸시 내용 정책(알림 본문 포함 여부)도 함께 검토합니다.

## 8) Push Notification Contents 정책

### 일반 모드

- 푸시 payload에 일부 메시지 내용이 포함될 수 있음
- 사용자 체감 알림 속도/가독성에 유리

### ID-only 모드(Enterprise)

- APNS/FCM에는 메시지 ID만 전달
- 앱이 푸시 수신 후 서버에서 본문을 조회
- 보안/컴플라이언스 요구가 높은 조직에 유리
- 일반 모드 대비 체감 지연이 약간 증가할 수 있음

문서 메뉴 기준:
- `System Console > Site Configuration > Notifications`
- `Push Notification Contents`에서 ID-only 동작에 해당하는 옵션 선택

## 9) 기능 검증(필수)

## 9-1) MPNS API 직접 테스트

MPNS의 테스트 API로 기본 동작 여부를 먼저 확인합니다.

```bash
curl http://127.0.0.1:8066/api/v1/send_push \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"message","message":"test","badge":1,"platform":"PLATFORM","server_id":"MATTERMOST_DIAG_ID","device_id":"DEVICE_ID","channel_id":"CHANNEL_ID"}'
```

### 테스트 파라미터 준비용 SQL 예시

`server_id`(DiagnosticId):

```sql
SELECT * FROM Systems WHERE Name = 'DiagnosticId';
```

`device_id`(대상 사용자):

```sql
SELECT
  Email, DeviceId
FROM
  Sessions,
  Users
WHERE
  Sessions.UserId = Users.Id
  AND DeviceId != ''
  AND Email = 'your_email@example.com';
```

`channel_id`(예: Town Square):

```sql
SELECT Id FROM Channels WHERE DisplayName = 'Town Square';
```

주의:
- 문서 마이그레이션 안내에 따라 device_id 접두사(`apple:`, `apple_rn:`, `android:`, `android_rn:`) 처리를 확인해야 할 수 있음
- 최신 세션 기준 device_id를 재조회해야 실패를 줄일 수 있음

## 9-2) 실제 사용자 시나리오 테스트

- 모바일에서 푸시 허용 상태 확인
- 서버에서 대상 사용자 멘션/DM 발생
- 잠금 화면/백그라운드 상태에서 푸시 수신 확인
- 메시지 탭 시 해당 채널/스레드 이동까지 확인

## 10) 트러블슈팅

### iOS: `DeviceTokenNotForTopic` (400)

가능한 원인:
- 오래된/다른 세션의 device_id 사용
- `ApplePushTopic`(번들 ID) 불일치
- 잘못된 키/팀 ID 조합

대응:
- 최신 device_id 재조회
- 앱 번들 ID와 MPNS 설정 값 일치 여부 재검증
- APNS 키 파일 및 ID 재확인

### 공통 실패 원인

- MPNS -> APNS/FCM 아웃바운드 차단
- 프록시/방화벽이 HTTP/2 미지원(특히 APNS)
- 인증 키 파일 권한/경로 오류
- Mattermost 서버의 MPNS URL 오설정

## 11) 운영 체크리스트

- [ ] MPNS 프로세스 상태(systemd) 정상
- [ ] Mattermost 서버에서 MPNS URL 설정 완료
- [ ] Android FCM 키 파일 경로/권한 확인
- [ ] iOS APNS p8 및 Topic/KeyID/TeamID 검증
- [ ] APNS HTTP/2 경로 검증
- [ ] 테스트 API + 실사용 시나리오 검증 완료
- [ ] 로그 모니터링 및 알림 체계 구성
- [ ] MPNS 보안 업데이트 적용 프로세스 수립

## 12) 보안/운영 권장사항

- MPNS 전용 계정으로 실행(최소권한)
- 설정/키 파일 접근권한 최소화
- Mattermost 서버 <-> MPNS 구간 TLS 적용
- 운영/스테이징 환경 분리
- 릴리스 노트 및 보안 공지 주기적 확인

---

## 13) 환경별 실제 적용 템플릿

아래 템플릿은 "그대로 붙여넣기"가 아니라, 각 환경에 맞는 값으로 치환해 사용하는 용도입니다.

- 치환 대상 예시:
  - `<MPNS_HOME>`: MPNS 설치 디렉터리
  - `<MPNS_USER>`: MPNS 실행 계정
  - `<MPNS_BIND_ADDR>`: MPNS Listen 주소(예: `0.0.0.0:8066`)
  - `<FCM_SERVICE_FILE>`: Firebase 서비스 계정 JSON 절대 경로
  - `<APNS_P8_FILE>`: APNS `.p8` 절대 경로
  - `<APPLE_TOPIC>`: iOS 앱 번들 ID
  - `<APPLE_KEY_ID>`, `<APPLE_TEAM_ID>`: Apple Developer 값
  - `<APNS_DEV_MODE>`: 개발 `true`, 운영 `false`
  - `<HTTP_PROXY_URL>`, `<HTTPS_PROXY_URL>`: 프록시 URL

### 13-0) 치환값 결정 기준(실무)

#### `<MPNS_HOME>`

- MPNS 설치 루트 경로입니다(예: `/opt/mattermost-push-proxy`).
- `bin/`, `config/` 기준 경로이므로 배포 자동화 스크립트와 동일한 값을 사용합니다.
- 릴리스 교체 시 심볼릭 링크 전략(예: `/opt/mattermost-push-proxy -> /opt/mattermost-push-proxy-vX`)을 쓰면 롤백이 쉬워집니다.

#### `<MPNS_USER>`

- 권장: 전용 서비스 계정(`mattermost-push-proxy`)으로 실행합니다.
- `root` 실행은 가급적 피하고, 키 파일 읽기 최소권한만 부여합니다.
- `systemd`의 `User`, `Group`과 실제 파일 소유권이 일치해야 권한 오류를 줄일 수 있습니다.

#### `<MPNS_BIND_ADDR>`

- 예: `127.0.0.1:8066`(로컬/프록시 전단), `0.0.0.0:8066`(내부망 직접 수신).
- 외부 노출이 불필요하면 `127.0.0.1` 바인딩 + 역방향 프록시를 권장합니다.
- 운영 전 `ss -lntp`로 실제 리슨 주소/포트를 확인합니다.

#### `<FCM_SERVICE_FILE>`

- Firebase Service Account JSON 파일의 절대 경로입니다.
- 파일 자체가 손상/오염되지 않았는지 JSON 구문 확인 후 반영합니다.
- 경로 실수/권한 미스가 Android 푸시 실패의 가장 흔한 원인 중 하나입니다.

#### `<APNS_P8_FILE>`, `<APPLE_TOPIC>`, `<APPLE_KEY_ID>`, `<APPLE_TEAM_ID>`

- iOS 푸시의 핵심 식별자 세트입니다.
- `ApplePushTopic`은 앱 번들 ID와 완전 일치해야 하며 대소문자도 구분됩니다.
- `.p8` 파일은 배포 파이프라인에서 암호화 저장 후 배포 시점에만 복호화하는 방식이 안전합니다.

#### `<APNS_DEV_MODE>`

- 개발 앱(sandbox APNS): `true`
- 운영 앱(production APNS): `false`
- 앱 빌드와 값이 불일치하면 iOS 푸시가 정상 전달되지 않습니다.

#### `<HTTP_PROXY_URL>`, `<HTTPS_PROXY_URL>`

- 망 정책상 직접 외부 통신이 차단된 경우에만 설정합니다.
- APNS는 HTTP/2가 필요하므로 프록시가 HTTP/2를 종단/중계 가능한지 반드시 확인합니다.
- 프록시 인증(계정/비밀번호/인증서) 만료 시 장애가 나므로 점검 항목에 포함합니다.

### 13-1) systemd unit 템플릿 (온프렘/클라우드 공통)

파일: `/etc/systemd/system/mattermost-push-proxy.service`

```ini
[Unit]
Description=Mattermost Push Proxy Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=<MPNS_USER>
Group=<MPNS_USER>
WorkingDirectory=<MPNS_HOME>
ExecStart=<MPNS_HOME>/bin/mattermost-push-proxy
Restart=always
RestartSec=5
LimitNOFILE=65535

# 프록시가 필요한 경우만 사용
# Environment="HTTP_PROXY=<HTTP_PROXY_URL>"
# Environment="HTTPS_PROXY=<HTTPS_PROXY_URL>"

# 보안 하드닝(환경에 맞게 조정)
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=<MPNS_HOME>

[Install]
WantedBy=multi-user.target
```

적용 명령:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mattermost-push-proxy
sudo systemctl restart mattermost-push-proxy
sudo systemctl status mattermost-push-proxy
```

운영 해설:

- `Restart=always`: 일시 장애 자동 복구
- `LimitNOFILE=65535`: 소켓/파일 핸들 부족 완화
- `ProtectSystem=full`, `ProtectHome=true`: 시스템 영역 쓰기 제한
- 하드닝 옵션 적용 후 기동 실패 시 `journalctl -u mattermost-push-proxy -n 200`로 원인 확인
- 프록시 환경은 `HTTPS_PROXY` 우선, 필요 시 `HTTP_PROXY`를 보조로 사용

### 13-2) MPNS 설정 파일 템플릿

파일: `<MPNS_HOME>/config/mattermost-push-proxy.json`

```json
{
  "ListenAddress": "<MPNS_BIND_ADDR>",
  "AndroidPushSettings": {
    "ServiceFileLocation": "<FCM_SERVICE_FILE>"
  },
  "ApplePushSettings": [
    {
      "Type": "apple_rn",
      "ApplePushUseDevelopment": <APNS_DEV_MODE>,
      "ApplePushTopic": "<APPLE_TOPIC>",
      "AppleAuthKeyFile": "<APNS_P8_FILE>",
      "AppleAuthKeyID": "<APPLE_KEY_ID>",
      "AppleTeamID": "<APPLE_TEAM_ID>"
    }
  ]
}
```

주의:
- 운영에서는 `ApplePushUseDevelopment=false`를 우선 검토합니다.
- `ApplePushTopic`과 앱 번들 ID가 1글자라도 다르면 iOS 푸시가 실패할 수 있습니다.
- 키 파일은 루트/운영자만 읽도록 권한을 제한합니다(예: `chmod 600`).
- 설정 반영 후 MPNS 재시작 전 `jq . <MPNS_HOME>/config/mattermost-push-proxy.json`으로 JSON 유효성 검증을 권장합니다.

### 13-3) 환경별 구성 가이드

#### A) 온프렘(방화벽 내부)

- MPNS를 내부망에 두고 Mattermost 서버에서만 접근 허용
- MPNS -> APNS/FCM 아웃바운드 허용(특히 APNS HTTP/2)
- 내부 인증서 정책이 있으면 Mattermost 서버 <-> MPNS TLS 강제

#### B) 클라우드(VPC)

- MPNS를 프라이빗 서브넷에 배치, Security Group 최소 허용
- NAT Gateway/프록시를 통해 APNS/FCM 아웃바운드 확보
- Auto-recovery를 위해 systemd restart + 인스턴스 헬스체크 연동

#### C) 프록시 필수 환경

- `HTTPS_PROXY` 우선 설정
- 프록시 장비가 APNS HTTP/2를 중계 가능한지 사전 검증
- 프록시 인증서/SSL inspection 정책으로 인한 실패 로그를 별도 확인
- 프록시 경유 시 DNS 해석 정책(내부 DNS/외부 DNS)으로 인한 연결 실패 여부 점검

### 13-4) 사전 점검 스크립트 템플릿

파일: `scripts/check-mpns-env.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

MPNS_BIN="${1:-/opt/mattermost-push-proxy/bin/mattermost-push-proxy}"
MPNS_CFG="${2:-/opt/mattermost-push-proxy/config/mattermost-push-proxy.json}"
FCM_FILE="${3:-/opt/mattermost-push-proxy/config/fcm-service-account.json}"
APNS_FILE="${4:-/opt/mattermost-push-proxy/config/apple/AuthKey.p8}"

echo "[1/5] binary check"
test -x "$MPNS_BIN" && echo "OK: $MPNS_BIN" || { echo "FAIL: binary not executable"; exit 1; }

echo "[2/5] config check"
test -f "$MPNS_CFG" && echo "OK: $MPNS_CFG" || { echo "FAIL: config not found"; exit 1; }

echo "[3/5] key file check"
test -r "$FCM_FILE" && echo "OK: FCM file readable" || { echo "FAIL: FCM file unreadable"; exit 1; }
test -r "$APNS_FILE" && echo "OK: APNS file readable" || { echo "FAIL: APNS file unreadable"; exit 1; }

echo "[4/5] APNS/FCM outbound check (network)"
curl -I --max-time 10 https://api.push.apple.com >/dev/null && echo "OK: APNS reachable" || echo "WARN: APNS reachability check failed"
curl -I --max-time 10 https://fcm.googleapis.com >/dev/null && echo "OK: FCM reachable" || echo "WARN: FCM reachability check failed"

echo "[5/5] systemd check"
systemctl is-enabled mattermost-push-proxy >/dev/null && echo "OK: service enabled" || echo "WARN: service not enabled"
systemctl is-active mattermost-push-proxy >/dev/null && echo "OK: service active" || { echo "FAIL: service inactive"; exit 1; }

echo "DONE: baseline checks passed"
```

### 13-5) 배포 후 검증 스크립트 템플릿

파일: `scripts/test-mpns-send.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

MPNS_URL="${1:-http://127.0.0.1:8066}"
PLATFORM="${2:?platform required (apple|apple_rn|android|android_rn)}"
SERVER_ID="${3:?server_id required}"
DEVICE_ID="${4:?device_id required}"
CHANNEL_ID="${5:?channel_id required}"

curl "${MPNS_URL}/api/v1/send_push" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"type\":\"message\",
    \"message\":\"mpns test\",
    \"badge\":1,
    \"platform\":\"${PLATFORM}\",
    \"server_id\":\"${SERVER_ID}\",
    \"device_id\":\"${DEVICE_ID}\",
    \"channel_id\":\"${CHANNEL_ID}\"
  }"
echo
echo "DONE: request sent"
```

실행 예시:

```bash
chmod +x scripts/check-mpns-env.sh scripts/test-mpns-send.sh
./scripts/check-mpns-env.sh
./scripts/test-mpns-send.sh http://127.0.0.1:8066 apple_rn <SERVER_ID> <DEVICE_ID> <CHANNEL_ID>
```

### 13-6) 운영 전 최종 확인 포인트

- Android/iOS 모두 실제 기기에서 알림 수신 확인
- 앱 백그라운드/잠금화면 상태에서 탭 이동 동작 확인
- 푸시 지연 시간(평균/최대)과 실패율 지표 수집
- 장애 대응을 위해 최근 24시간 로그 보존/검색 가능 상태 확인

### 13-7) 단계별 배포 런북(권장 순서)

1. **자격증명 준비**
   - Android FCM JSON, iOS APNS `.p8` 및 Apple 식별자 확보
   - 파일 권한 최소화(`chown`, `chmod`) 적용
2. **MPNS 설치/설정**
   - 바이너리 배치, `mattermost-push-proxy.json` 작성
   - 값 치환 후 JSON 유효성 검증
3. **서비스 기동**
   - systemd 등록/재로드/재시작
   - `systemctl is-active`로 활성 상태 확인
4. **네트워크 점검**
   - MPNS -> APNS/FCM 도달성 확인
   - 프록시 환경은 HTTP/2 통과 여부 확인
5. **기능 검증**
   - `test-mpns-send.sh` 1차 점검
   - 실제 모바일 기기 알림 수신/탭 이동 검증
6. **운영 전환**
   - 모니터링/로그 보존 정책 반영
   - 장애 알림 룰 및 재기동 정책 확정

### 13-8) 증상별 1차 진단 가이드

#### 증상: Android만 푸시 실패

- FCM 키 파일 경로/권한/파일 포맷 확인
- Firebase 프로젝트와 실제 앱 설정 불일치 여부 확인
- MPNS 로그에서 Android 전송 오류 코드 확인

#### 증상: iOS만 푸시 실패

- `ApplePushTopic`(번들 ID) 일치 여부 확인
- `ApplePushUseDevelopment` 값과 앱 빌드 타입 일치 여부 확인
- `AppleAuthKeyID`, `AppleTeamID`, `.p8` 파일 경로 재검증

#### 증상: Android/iOS 모두 실패

- Mattermost 서버의 MPNS URL 설정값 확인
- MPNS 서비스 비활성/비정상 여부 확인
- MPNS -> APNS/FCM 아웃바운드 네트워크/프록시 정책 확인

### 13-9) 롤백 전략(권장)

- 설정 변경 전 `mattermost-push-proxy.json` 백업
- 바이너리 업그레이드 전 이전 버전 보관
- 장애 발생 시 즉시:
  - 이전 설정 복원
  - 이전 바이너리로 재기동
  - `test-mpns-send.sh`로 최소 기능 재검증
- 롤백 이후 장애 원인은 운영 기록(원인/시간/영향/재발방지)으로 남깁니다.

### 13-10) 운영 모니터링 최소 기준

- 서비스 상태: `systemctl is-active` 주기 점검
- 에러 로그: APNS/FCM 전송 실패율 추적
- 지연 지표: 푸시 요청 -> 디바이스 수신까지 체감 지연 추세 확인
- 인증서/키 수명주기: 만료 알림 및 교체 절차 문서화
