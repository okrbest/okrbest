# [![OKR.BEST 로고](https://github.com/user-attachments/assets/afd3fa9b-59b1-4659-b1ff-c6d1dae40597)](https://okr.best)

[OKR.BEST](https://okr.best)는 기업이 안전한 협업을 위한 오픈 소스 플랫폼입니다. 이 저장소는 OKR.BEST 플랫폼의 핵심 개발을 위한 주요 소스입니다. Go와 React로 작성되었으며 MySQL 또는 PostgreSQL과 함께 단일 Linux 바이너리로 실행됩니다. 매월 16일에 MIT 라이선스 하에 새로운 컴파일 버전이 출시됩니다.

[OKR.BEST를 온프레미스로 배포](https://mattermost.com/deploy/?utm_source=github-mattermost-server-readme)하거나 [클라우드에서 무료로 사용해보세요](https://mattermost.com/sign-up/?utm_source=github-mattermost-server-readme).

<img width="1006" alt="mattermost 사용자 인터페이스" src="https://user-images.githubusercontent.com/7205829/136107976-7a894c9e-290a-490d-8501-e5fdbfc3785a.png">

OKR.BEST의 다음 사용 사례에 대해 자세히 알아보세요:

-   [DevSecOps](https://mattermost.com/solutions/use-cases/devops/?utm_source=github-mattermost-server-readme)
-   [응급상황황 해결](https://mattermost.com/solutions/use-cases/incident-resolution/?utm_source=github-mattermost-server-readme)
-   [IT 서비스 데스크](https://mattermost.com/solutions/use-cases/it-service-desk/?utm_source=github-mattermost-server-readme)

기타 유용한 리소스:

-   [OKR.BEST 다운로드 및 설치](https://docs.mattermost.com/guides/deployment.html) - 자체 OKR.BEST 인스턴스를 설치, 설정 및 구성하세요.
-   [제품 문서](https://docs.mattermost.com/) - OKR.BEST 인스턴스를 실행하고 모든 기능을 활용하는 방법을 알아보세요.
-   [개발자 문서](https://developers.mattermost.com/) - API, 웹훅, 슬래시 명령, 앱 및 플러그인을 통해 OKR.BEST에 코드를 기여하거나 통합을 구축하세요.

# 목차

-   [OKR.BEST 설치](#install-mattermost)
-   [네이티브 모바일 및 데스크톱 앱](#native-mobile-and-desktop-apps)
-   [보안 공지 받기](#get-security-bulletins)
-   [참여하기](#get-involved)
-   [더 알아보기](#learn-more)
-   [라이선스](#license)
-   [최신 소식 받기](#get-the-latest-news)
-   [기여하기](#contributing)

## OKR.BEST 설치

-   [OKR.BEST 자체 호스팅 다운로드 및 설치](https://docs.mattermost.com/guides/deployment.html) - Docker, Ubuntu 또는 tar를 통해 몇 분 만에 OKR.BEST 자체 호스팅 인스턴스를 배포하세요.
-   [클라우드에서 시작하기](https://mattermost.com/sign-up/?utm_source=github-mattermost-server-readme)로 OKR.BEST를 바로 사용해보세요.
-   [개발자 환경경 설정](https://developers.mattermost.com/contribute/server/developer-setup) - OKR.BEST 코드 작성을 원하시면 이 가이드를 따르세요.

기타 설치 가이드:

-   [Docker에 OKR.BEST 배포](https://docs.mattermost.com/install/install-docker.html)
-   [OKR.BEST Omnibus](https://docs.mattermost.com/install/installing-mattermost-omnibus.html)
-   [Tar로 OKR.BEST 설치](https://docs.mattermost.com/install/install-tar.html)
-   [Ubuntu 20.04 LTS](https://docs.mattermost.com/install/installing-ubuntu-2004-LTS.html)
-   [Kubernetes](https://docs.mattermost.com/install/install-kubernetes.html)
-   [Helm](https://docs.mattermost.com/install/install-kubernetes.html#installing-the-operators-via-helm)
-   [Debian Buster](https://docs.mattermost.com/install/install-debian.html)
-   [RHEL 8](https://docs.mattermost.com/install/install-rhel-8.html)
-   [더 많은 서버 설치 가이드](https://docs.mattermost.com/guides/deployment.html)

## 네이티브 모바일 및 데스크톱 앱

웹 인터페이스 외에도 [Android](https://mattermost.com/pl/android-app/), [iOS](https://mattermost.com/pl/ios-app/), [Windows PC](https://docs.mattermost.com/install/desktop-app-install.html#windows-10-windows-8-1), [macOS](https://docs.mattermost.com/install/desktop-app-install.html#macos-10-9), [Linux](https://docs.mattermost.com/install/desktop-app-install.html#linux)용 OKR.BEST 클라이언트를 다운로드할 수 있습니다.

[<img src="https://user-images.githubusercontent.com/30978331/272826427-6200c98f-7319-42c3-86d4-0b33ae99e01a.png" alt="Google Play에서 Mattermost 받기" height="50px"/>](https://mattermost.com/pl/android-app/) [<img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store에서 Mattermost 받기" height="50px"/>](https://itunes.apple.com/us/app/mattermost/id1257222717?mt=8) [![Windows PC에서 Mattermost 받기](https://user-images.githubusercontent.com/33878967/33095357-39cab8d2-ceb8-11e7-89a6-67dccc571ca3.png)](https://docs.mattermost.com/install/desktop.html#windows-10-windows-8-1-windows-7) [![Mac OSX에서 Mattermost 받기](https://user-images.githubusercontent.com/33878967/33095355-39a36f2a-ceb8-11e7-9b33-73d4f6d5d6c1.png)](https://docs.mattermost.com/install/desktop.html#macos-10-9) [![Linux에서 Mattermost 받기](https://user-images.githubusercontent.com/33878967/33095354-3990e256-ceb8-11e7-965d-b00a16e578de.png)](https://docs.mattermost.com/install/desktop.html#linux)

## 보안 공지 받기

중요한 보안 업데이트 알림을 받으세요. 온라인 공격자의 정교함은 계속해서 증가하고 있습니다. OKR.BEST를 배포하는 경우 중요한 보안 릴리스 업데이트를 위해 OKR.BEST 보안 공지 메일링 리스트를 구독하는 것이 권장됩니다.

[여기서 구독하기](https://mattermost.com/security-updates/#sign-up)

## 참여하기

-   [OKR.BEST에 기여하기](https://handbook.mattermost.com/contributors/contributors/ways-to-contribute)
-   ["도움이 필요한" 프로젝트 찾기](https://github.com/mattermost/mattermost-server/issues?page=1&q=is%3Aissue+is%3Aopen+%22Help+Wanted%22&utf8=%E2%9C%93)
-   [기여자를 위한 OKR.BEST 서버에서 개발자 토론에 참여하기](https://community.mattermost.com/signup_user_complete/?id=f1924a8db44ff3bb41c96424cdc20676)
-   [OKR.BEST 도움 받기](https://docs.mattermost.com/guides/get-help.html)

## 더 알아보기

-   [API 옵션 - 웹훅, 슬래시 명령, 드라이버 및 웹 서비스](https://api.mattermost.com/)
-   [OKR.BEST 사용 사례 보기](https://mattermost.com/customers/)
-   [700개 이상의 OKR.BEST 통합 둘러보기](https://mattermost.com/marketplace/)

## 라이선스

라이선스 권리 및 제한 사항은 [LICENSE 파일](LICENSE.txt)을 참조하세요.

## 최신 소식 받기

-   **X** - [X(구 Twitter)에서 OKR.BEST 팔로우하기](https://twitter.com/mattermost)
-   **블로그** - [Mattermost 블로그](https://mattermost.com/blog/)에서 최신 업데이트 받기
-   **Facebook** - [Facebook에서 OKR.BEST 팔로우하기](https://www.facebook.com/MattermostHQ)
-   **LinkedIn** - [LinkedIn에서 OKR.BEST 팔로우하기](https://www.linkedin.com/company/mattermost/)
-   **이메일** - [뉴스레터](https://mattermost.us11.list-manage.com/subscribe?u=6cdba22349ae374e188e7ab8e&id=2add1c8034) 구독하기 (월 1-2회)
-   **OKR.BEST** - [OKR.BEST 커뮤니티 서버](https://community.mattermost.com)의 ~contributors 채널에 참여하기
-   **YouTube** - [OKR.BEST](https://www.youtube.com/@MattermostHQ) 구독하기

## 기여하기

[![작은 이미지](https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod)](https://gitpod.io/#https://github.com/mattermost/mattermost)

[CONTRIBUTING.md](./CONTRIBUTING.md)를 참조해 주세요.
[OKR.BEST 기여자 서버에 참여](https://community.mattermost.com/signup_user_complete/?id=codoy5s743rq5mk18i7u5ksz7e)하여 기여, 개발 등에 대한 커뮤니티 토론에 참여하세요.
