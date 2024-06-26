<?php
/**
 * @author Adam Charron <adam.c@vanillaforums.com>
 * @copyright 2009-2024 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

namespace VanillaTests\APIv2;

use Vanilla\CurrentTimeStamp;
use Vanilla\Forum\Models\CommunityManagement\EscalationModel;
use VanillaTests\ExpectExceptionTrait;
use VanillaTests\Forum\Utils\CommunityApiTestTrait;
use VanillaTests\SiteTestCase;
use VanillaTests\UsersAndRolesApiTestTrait;

/**
 * Tests for /api/v2/escalations
 */
class EscalationsTest extends SiteTestCase
{
    use CommunityApiTestTrait;
    use ExpectExceptionTrait;
    use UsersAndRolesApiTestTrait;

    /**
     * @return void
     */
    public function setUp(): void
    {
        parent::setUp();
        CurrentTimeStamp::mockTime("2024-01-01");
    }

    /**
     * Test that we can create an escalation from one or more reports.
     */
    public function testCreateEscalationsFromReports(): void
    {
        $this->createCategory(["name" => "my cat"]);
        $discussion = $this->createDiscussion(["name" => "Bad Post"]);
        $report1 = $this->createReport($discussion, ["reportReasonIDs" => ["abuse"]]);
        $report2 = $this->createReport($discussion, ["reportReasonIDs" => ["spam"]]);
        $escalation = $this->api()->post("/escalations", [
            "recordType" => "discussion",
            "recordID" => $discussion["discussionID"],
            "name" => "What a bad post!",
            "reportID" => $report1["reportID"],
        ]);

        $this->assertDataLike(
            [
                "name" => "What a bad post!",
                "placeRecordName" => "my cat",
                "recordIsLive" => true,
                "status" => EscalationModel::STATUS_OPEN,
                "recordUrl" => $discussion["url"],
                "countReports" => 2,
                "reportReasonIDs" => ["abuse", "spam"],
            ],
            $escalation->getBody()
        );
    }

    /**
     * Test that creating an escalation can create a report automatically.
     */
    public function testCreateEscalationWithoutReport()
    {
        // We can make an escalation directly
        $this->createCategory();
        $discussion = $this->createDiscussion();
        $escalation = $this->api()
            ->post("/escalations", [
                "recordType" => "discussion",
                "recordID" => $discussion["discussionID"],
                "name" => "What a bad post 2!",
                "reportReasonIDs" => ["spam"],
                "noteFormat" => "markdown",
                "noteBody" => "so bad",
            ])
            ->getBody();

        $this->assertDataLike(
            [
                "name" => "What a bad post 2!",
                "recordIsLive" => true,
                "status" => EscalationModel::STATUS_OPEN,
                "recordUrl" => $discussion["url"],
                "countReports" => 1,
                "reportReasonIDs" => ["spam"],
            ],
            $escalation
        );

        // We can get the escalation
        $fetched = $this->api()
            ->get("/escalations/{$escalation["escalationID"]}")
            ->getBody();
        $this->assertEquals($escalation, $fetched);
    }

    /**
     * Test listing of escalations.
     */
    public function testListEscalations()
    {
        $this->createCategory();
        $disc1 = $this->createDiscussion();
        $esc1 = $this->createEscalation($disc1);
        $disc2 = $this->createDiscussion();
        $esc2 = $this->createEscalation($disc2);

        $escalations = $this->api()
            ->get("/escalations", ["placeRecordType" => "category", "placeRecordID" => $this->lastInsertedCategoryID])
            ->getBody();
        $this->assertCount(2, $escalations);
        $this->assertRowsLike(
            [
                "recordType" => ["discussion", "discussion"],
                "recordID" => [$disc1["discussionID"], $disc2["discussionID"]],
            ],
            $escalations
        );
    }

    /**
     * Test that escalations can create and restore posts.
     */
    public function testEscalationRemoveRestorePost()
    {
        $this->createCategory();
        $discussion = $this->createDiscussion();
        $comment = $this->createComment();
        $report = $this->createReport($comment, ["reportReasonIDs" => ["abuse"]]);

        $escalation = $this->createEscalation($comment, [
            "reportID" => $report["reportID"],
            "recordIsLive" => false,
            "name" => "What a bad post!",
        ]);
        $this->assertDataLike(
            [
                "name" => "What a bad post!",
                "recordIsLive" => false,
                "status" => EscalationModel::STATUS_OPEN,
                "countReports" => 1,
                "reportReasonIDs" => ["abuse"],
            ],
            $escalation
        );

        $this->runWithExpectedExceptionCode(404, function () use ($comment) {
            $this->api()->get("/comments/{$comment["commentID"]}");
        });

        // now restore it
        $patched = $this->api()
            ->patch("/escalations/{$escalation["escalationID"]}", [
                "recordIsLive" => true,
            ])
            ->getBody();

        $this->assertDataLike(
            [
                "recordIsLive" => true,
                "recordUrl" => $comment["url"],
            ],
            $patched
        );

        // We should be able to do the same thing for a discussion
        $discEscalation = $this->createEscalation($discussion, [
            "recordIsLive" => false,
            "name" => "Bad discussion!",
        ]);
        $this->assertDataLike(
            [
                "name" => "Bad discussion!",
                "recordIsLive" => false,
                "status" => EscalationModel::STATUS_OPEN,
                "countReports" => 1,
            ],
            $discEscalation
        );

        $this->runWithExpectedExceptionCode(410, function () use ($discussion) {
            $this->api()->get("/discussions/{$discussion["discussionID"]}");
        });
        // Comment should have been removed too
        $this->runWithExpectedExceptionCode(404, function () use ($comment) {
            $this->api()->get("/comments/{$comment["commentID"]}");
        });

        // If I restore the post, the comments come back
        $patched = $this->api()
            ->patch("/escalations/{$discEscalation["escalationID"]}", [
                "recordIsLive" => true,
            ])
            ->getBody();

        $discussion = $this->api()->get("/discussions/{$discussion["discussionID"]}");
        $comment = $this->api()->get("/comments/{$comment["commentID"]}");
        $this->assertEquals(200, $comment->getStatusCode());
    }

    /**
     * Test that we can unassign users.
     *
     * @return void
     */
    public function testUnassignUser(): void
    {
        $this->createCategory();
        $discussion = $this->createDiscussion();
        $escalation = $this->createEscalation($discussion, [
            "assignedUserID" => $this->api->getUserID(),
        ]);

        $this->assertEquals($this->api->getUserID(), $escalation["assignedUserID"]);

        // No remove the assigned user.
        $patched = $this->api()
            ->patch("/escalations/{$escalation["escalationID"]}", [
                "assignedUserID" => EscalationModel::UNASSIGNED_USER_ID,
            ])
            ->getBody();

        $this->assertEquals(EscalationModel::UNASSIGNED_USER_ID, $patched["assignedUserID"]);
    }

    /**
     * Test that we can properly filter for assigned users.
     */
    public function testFilters(): void
    {
        CurrentTimeStamp::mockTime("2023-10-10");
        $this->resetTable("escalation");
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $user3 = $this->createUser();

        $this->createCategory();
        $discussion1 = $this->createDiscussion();
        $comment1 = $this->createComment();

        $cat2 = $this->createCategory();
        $discussion2 = $this->createDiscussion();

        $escalation1 = $this->createEscalation($discussion1, [
            "assignedUserID" => $user1["userID"],
            "status" => EscalationModel::STATUS_ON_HOLD,
        ]);

        $escalation2 = $this->createEscalation($discussion2, [
            "assignedUserID" => $user2["userID"],
            "status" => EscalationModel::STATUS_DONE,
        ]);

        $escalation3 = $this->createEscalation($comment1, [
            "assignedUserID" => $user3["userID"],
            "status" => EscalationModel::STATUS_IN_PROGRESS,
        ]);

        $unassignedEscalation = $this->createEscalation($comment1);

        // Filter by assigned userID.
        $this->assertEscalations(["assignedUserID" => $user1["userID"]], [$escalation1]);
        $this->assertEscalations(["assignedUserID" => EscalationModel::UNASSIGNED_USER_ID], [$unassignedEscalation]);
        $this->assertEscalations(
            ["assignedUserID" => [$user1["userID"], $user2["userID"], EscalationModel::UNASSIGNED_USER_ID]],
            [$escalation1, $escalation2, $unassignedEscalation]
        );

        // Filter by recordType
        $this->assertEscalations(["recordType" => "discussion"], [$escalation1, $escalation2]);

        // Filter by recordType & recordID
        $this->assertEscalations(
            ["recordType" => "discussion", "recordID" => $discussion1["discussionID"]],
            [$escalation1]
        );

        // Filter by status
        $this->assertEscalations(["status" => EscalationModel::STATUS_DONE], [$escalation2]);
        // Filter by multiple statuses
        $this->assertEscalations(
            ["status" => [EscalationModel::STATUS_DONE, EscalationModel::STATUS_ON_HOLD]],
            [$escalation1, $escalation2]
        );

        // Filter by categoryID
        $this->assertEscalations(
            ["placeRecordType" => "category", "placeRecordID" => $cat2["categoryID"]],
            [$escalation2]
        );
    }

    /**
     * Test that pagination works on the escalation endpoints.
     *
     * @return void
     */
    public function testPagination(): void
    {
        $this->resetTable("escalation");
        $this->createCategory();
        $discussion = $this->createDiscussion();

        for ($i = 0; $i < 3; $i++) {
            $this->createEscalation($discussion);
        }

        $response = $this->api()->get("/escalations", ["limit" => 1]);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(1, $response->getBody());
        $this->assertEquals(3, $response->getHeader("x-app-page-result-count"));
        $this->assertEquals(
            "https://vanilla.test/escalationstest/api/v2/escalations?page=2&limit=1",
            $response->getHeader("x-app-page-next-url")
        );

        // Get the next page
        $response = $this->api()->get($response->getHeader("x-app-page-next-url"));
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(1, $response->getBody());
        $this->assertEquals(3, $response->getHeader("x-app-page-result-count"));
        $this->assertEquals(
            "https://vanilla.test/escalationstest/api/v2/escalations?page=1&limit=1",
            $response->getHeader("x-app-page-prev-url")
        );
    }

    /**
     * Test that we can filter by report reasons.
     */
    public function testReportReasonFilters(): void
    {
        $this->resetTable("escalation");
        $this->resetTable("report");
        $this->createCategory();

        $disc1 = $this->createDiscussion();
        $report1 = $this->createReport($disc1, ["reportReasonIDs" => ["spam"]]);
        $report2 = $this->createReport($disc1, ["reportReasonIDs" => ["abuse"]]);
        $esc1 = $this->createEscalation($disc1, ["reportID" => $report1["reportID"]]);

        $disc2 = $this->createDiscussion();
        $esc2 = $this->createEscalation($disc2, ["reportReasonIDs" => ["abuse", "sexual-content"]]);

        $this->assertEscalations(["reportReasonID" => ["spam"]], [$esc1]);
        $this->assertEscalations(["reportReasonID" => ["abuse"]], [$esc1, $esc2]);
        $this->assertEscalations(["reportReasonID" => ["abuse", "sexual-content"]], [$esc1, $esc2]);
        $this->assertEscalations(["reportReasonID" => ["sexual-content"]], [$esc2]);
    }

    /**
     * Test that we can filter by recordUserID and recordUserRoleID
     */
    public function testUserFilters(): void
    {
        $this->createCategory();
        $modUser = $this->createUser(["roleID" => [\RoleModel::MOD_ID, \RoleModel::MEMBER_ID]]);
        $memberUser = $this->createUser(["roleID" => [\RoleModel::MEMBER_ID]]);

        $modDiscussion = $this->runWithUser(function () {
            return $this->createDiscussion();
        }, $modUser);

        $memberDiscussion = $this->runWithUser(function () {
            return $this->createDiscussion();
        }, $memberUser);

        CurrentTimeStamp::mockTime("2024-01-01");
        $modEscalation = $this->createEscalation($modDiscussion);
        $memberEscalation = $this->createEscalation($memberDiscussion);

        $this->assertEscalations(["recordUserID" => $modUser["userID"]], [$modEscalation]);
        $this->assertEscalations(["recordUserID" => $memberUser["userID"]], [$memberEscalation]);
        $this->assertEscalations(
            ["recordUserID" => [$memberUser["userID"], $modUser["userID"]]],
            [$modEscalation, $memberEscalation]
        );
        $this->assertEscalations(["recordUserRoleID" => \RoleModel::MOD_ID], [$modEscalation]);
        $this->assertEscalations(["recordUserRoleID" => \RoleModel::MEMBER_ID], [$modEscalation, $memberEscalation]);
    }

    /**
     * Assert that we can query the escalations API and get certain results.
     *
     * @param array $params
     * @param array $expectedEscalations
     */
    private function assertEscalations(array $params, array $expectedEscalations): void
    {
        $response = $this->api()->get("/escalations", $params);
        $this->assertEquals(200, $response->getStatusCode());
        $escalations = $response->getBody();

        $expectedEscalationIDs = array_column($expectedEscalations, "escalationID");
        $actualEscalationIDs = array_column($escalations, "escalationID");
        $this->assertEquals($expectedEscalationIDs, $actualEscalationIDs, "Did not find expected escalations.");
    }
}
