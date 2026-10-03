# 계약: 라이브러리 공개 표면

**기능**: [spec.md](../spec.md) | **작성**: 2026-10-03

`@mattermost/playwright-lib`가 스펙 파일에 노출하는 표면이다.
`lib/src/index.ts`가 정본이고 upstream이 +28/-2로 추가한다.

## 스택 수명

```ts
export {startStack, stopStack} from './containers';
```

global setup이 쓴다. 스펙이 직접 부르지 않는다.

## 설정과 서비스 이름

```ts
export {testConfig, TESTCONTAINERS_SERVICE_NAMES} from './test_config';
export type {TestContainersServiceName} from './test_config';
```

`TESTCONTAINERS_SERVICE_NAMES`가 선택 서비스의 정본이다.
`requirements.ts`의 `ADDITIONAL_SERVICE_STARTERS`가 같은 타입을 키로 받아,
둘이 갈라지면 `tsc -b`가 잡는다.

## 서비스 보장 함수 (`ensure*`)

스펙이 "이 서비스가 필요하다"고 선언하는 수단이다. 필요하면 서버를 재기동하고,
이미 맞는 상태면 아무것도 하지 않는다.

```ts
ensureOpenldap, ensureKeycloak, ensureMinio, ensureAzurite,
ensureElasticsearch, ensureOpensearch, ensureLocalFile,
ensurePostgresSearch, ensureFeatureFlag, ensureMmctl
```

`bootEnvOverrides`를 먼저 확인하고 **바뀔 게 있을 때만** 재기동한다. 그리고 재기동이
기존 덮어쓰기를 지우지 않도록 레코드에 병합한다 — 한 서비스 때문에 재기동했다고
다른 서비스 설정이 풀리면 안 된다.

## 서비스 조작 헬퍼

```ts
// LDAP
generateLdapUser, createLdapUser, updateLdapUser, deleteLdapUser, ldapServerConfig
// Keycloak (SAML)
createKeycloakUser, deleteKeycloakUser, samlServerConfig
// 스토리지
listMinioObjectKeys, listAzuriteBlobNames
// 검색
elasticsearchServerConfig, opensearchServerConfig
// mmctl
runMmctl
```

타입: `InbucketEmail`, `LdapUser`, `KeycloakUser`, `MmctlResult`.

## okrbest가 노출하지 않는 것

우리 트리는 upstream 대비 export 8줄을 제거한 상태다 — `WysiwygEditor`,
`wysiwyg_helpers` 전체(`setWysiwygUserPreference`, `WYSIWYG_PREF_CATEGORY`,
`WYSIWYG_PREF_NAME`), `TextInputSetting`, `ensureAutotranslationPermissions`,
`licenseTier`. 우리에게 없는 기능이다.

**이 제거를 되살리지 않는다**(D4). upstream 추가분과 파일 내 위치가 겹치지 않으므로
추가분만 받는다. 되살리면 없는 모듈을 export해 `tsc -b`가 깨진다.
