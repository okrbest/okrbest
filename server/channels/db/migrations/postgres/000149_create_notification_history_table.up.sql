CREATE TABLE IF NOT EXISTS NotificationHistory (
    Id VARCHAR(26) PRIMARY KEY,
    UserId VARCHAR(26) NOT NULL,
    SenderId VARCHAR(26),
    Type VARCHAR(32) NOT NULL,
    PostId VARCHAR(26),
    ChannelId VARCHAR(26),
    TeamId VARCHAR(26),
    RootId VARCHAR(26),
    Title VARCHAR(256),
    Message VARCHAR(512),
    IsRead BOOLEAN NOT NULL DEFAULT false,
    IsUrgent BOOLEAN NOT NULL DEFAULT false,
    CreateAt BIGINT NOT NULL,
    ReadAt BIGINT DEFAULT 0
);

-- 사용자별 알림 조회 최적화 (정렬 포함)
CREATE INDEX IF NOT EXISTS idx_notification_history_user_createat 
ON NotificationHistory(UserId, CreateAt DESC);

-- 읽지 않은 알림 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread 
ON NotificationHistory(UserId, IsRead) WHERE IsRead = false;

-- 채널별 알림 조회/업데이트 최적화
CREATE INDEX IF NOT EXISTS idx_notification_history_user_channel 
ON NotificationHistory(UserId, ChannelId);

-- 오래된 알림 삭제 최적화
CREATE INDEX IF NOT EXISTS idx_notification_history_createat 
ON NotificationHistory(CreateAt);
