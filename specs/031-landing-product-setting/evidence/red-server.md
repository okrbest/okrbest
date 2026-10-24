public/model/team_test.go:153:43: o.LandingProduct undefined (type Team has no field or method LandingProduct)
public/model/team_test.go:156:21: unknown field LandingProduct in struct literal of type TeamPatch
public/model/team_test.go:157:25: o.LandingProduct undefined (type Team has no field or method LandingProduct)
public/model/team_test.go:172:39: undefined: LandingProductBoards
public/model/team_test.go:172:61: undefined: LandingProductPlaybooks
public/model/team_test.go:172:61: too many errors
FAIL	github.com/mattermost/mattermost/server/public/model [build failed]
FAIL
                	            	@@ -1 +1 @@
                	            	-boards
                	            	+
                	Test:       	TestTeamStore/PostgreSQL/LandingProductRoundTrip
                	Messages:   	LandingProduct should survive Get
FAIL
FAIL	github.com/mattermost/mattermost/server/v8/channels/store/sqlstore	0.414s
FAIL
