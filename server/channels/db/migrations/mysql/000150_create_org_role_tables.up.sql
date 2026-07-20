CREATE TABLE IF NOT EXISTS PositionDefinitions (
    ID varchar(26) PRIMARY KEY,
    TeamID varchar(26) NOT NULL,
    Code varchar(64) NOT NULL,
    Name varchar(128) NOT NULL,
    Rank int NOT NULL DEFAULT 0,
    Active boolean NOT NULL DEFAULT true,
    FullVisibility boolean NOT NULL DEFAULT false,
    CreateAt bigint NOT NULL,
    UpdateAt bigint NOT NULL,
    UNIQUE KEY idx_positiondefinitions_teamid_code (TeamID, Code)
);

CREATE TABLE IF NOT EXISTS OrgUnits (
    ID varchar(26) PRIMARY KEY,
    TeamID varchar(26) NOT NULL,
    Code varchar(64) NOT NULL,
    Name varchar(128) NOT NULL,
    Type varchar(32) NOT NULL,
    ParentID varchar(26) NOT NULL DEFAULT '',
    Active boolean NOT NULL DEFAULT true,
    CreateAt bigint NOT NULL,
    UpdateAt bigint NOT NULL,
    UNIQUE KEY idx_orgunits_teamid_code (TeamID, Code),
    KEY idx_orgunits_teamid_parentid (TeamID, ParentID)
);

CREATE TABLE IF NOT EXISTS UserOrgProfiles (
    TeamID varchar(26) NOT NULL,
    UserID varchar(26) NOT NULL,
    PrimaryPositionID varchar(26) NOT NULL DEFAULT '',
    PrimaryOrgUnitID varchar(26) NOT NULL DEFAULT '',
    ExtraPositions json NOT NULL DEFAULT ('[]'),
    EffectiveFrom bigint NOT NULL DEFAULT 0,
    EffectiveTo bigint NOT NULL DEFAULT 0,
    CreateAt bigint NOT NULL,
    UpdateAt bigint NOT NULL,
    PRIMARY KEY (TeamID, UserID),
    KEY idx_userorgprofiles_teamid_primaryorgunitid (TeamID, PrimaryOrgUnitID),
    KEY idx_userorgprofiles_teamid_primarypositionid (TeamID, PrimaryPositionID)
);

CREATE TABLE IF NOT EXISTS OrgRoleAuditLogs (
    ID varchar(26) PRIMARY KEY,
    TeamID varchar(26) NOT NULL,
    ActorUserID varchar(26) NOT NULL,
    Action varchar(64) NOT NULL,
    EntityType varchar(32) NOT NULL,
    EntityID varchar(26) NOT NULL,
    BeforeState json,
    AfterState json,
    CreateAt bigint NOT NULL,
    KEY idx_orgroleauditlogs_teamid_createat (TeamID, CreateAt)
);
