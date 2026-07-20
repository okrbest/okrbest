ALTER TABLE UserOrgProfiles
    MODIFY COLUMN ExtraPositions json NOT NULL DEFAULT ('[]');
