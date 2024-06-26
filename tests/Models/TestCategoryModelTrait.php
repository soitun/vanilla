<?php
/**
 * @author Todd Burry <todd@vanillaforums.com>
 * @copyright 2009-2020 Vanilla Forums Inc.
 * @license GPL-2.0-only
 */

namespace VanillaTests\Models;

use CategoryModel;
use PHPUnit\Framework\TestCase;
use VanillaTests\VanillaTestCase;

trait TestCategoryModelTrait
{
    /**
     * @var CategoryModel
     */
    protected $categoryModel;

    private static $categoryIndex = 1;

    /**
     * Instantiate a fresh model for each
     */
    protected function setupTestCategoryModel()
    {
        $this->categoryModel = $this->container()->get(CategoryModel::class);

        // This is necessary right now because the category model itself gets an instance from the container.
        $this->container()->setInstance(CategoryModel::class, $this->categoryModel);
        CategoryModel::reset();
    }

    /**
     * Clear out the test category model instance.
     */
    protected function tearDownTestCategoryModel()
    {
        $this->container()->setInstance(CategoryModel::class, null);
    }

    /**
     * Create a test record.
     *
     * @param array $override
     *
     * @return array
     */
    public function newCategory(array $override): array
    {
        $i = self::$categoryIndex++;

        $r = $override + [
            "Name" => "Category %s",
            "UrlCode" => "cat-%s",
            "Description" => "Foo %s.",
            "DateInserted" => TestDate::mySqlDate(),
        ];

        foreach (["Name", "UrlCode", "Description"] as $field) {
            $r[$field] = sprintf($r[$field], $i);
        }

        return $r;
    }

    /**
     * Insert test records and return them.
     *
     * @param int $count
     * @param array $overrides An array of row overrides.
     * @return array
     */
    protected function insertCategories(int $count, array $overrides = []): array
    {
        $ids = [];
        for ($i = 0; $i < $count; $i++) {
            $id = $this->categoryModel->save($this->newCategory($overrides));
            if ($id === false) {
                throw new \Exception($this->categoryModel->Validation->resultsText(), 400);
            }
            $ids[] = $id;
        }
        $rows = $this->categoryModel->getWhere(["CategoryID" => $ids])->resultArray();
        TestCase::assertCount($count, $rows, "Not enough test categories were inserted.");

        return $rows;
    }

    /**
     * Insert a category that is private to one or more roles.
     *
     * @param array $roleIDs The roles to restrict to.
     * @param array $overrides Overrides for the category record.
     * @return array Returns the category.
     */
    protected function insertPrivateCategory(array $roleIDs, array $overrides = []): array
    {
        $overrides["CustomPermissions"] = true;

        $permissions = [];
        foreach ($roleIDs as $roleID) {
            $permissions[] = [
                "RoleID" => $roleID,
                "Vanilla.Discussions.View" => true,
                "Vanilla.Discussions.Add" => true,
                "Vanilla.Discussions.Edit" => true,
                "Vanilla.Discussions.Delete" => true,
                "Vanilla.Discussions.Announce" => true,
                "Vanilla.Discussions.Close" => true,
                "Vanilla.Discussions.Sink" => true,
                "Vanilla.Comments.Add" => true,
                "Vanilla.Comments.Edit" => true,
                "Vanilla.Comments.Delete" => true,
            ];
        }

        $overrides["Permissions"] = $permissions;

        $rows = $this->insertCategories(1, $overrides);
        return $rows[0];
    }

    /**
     * Follow a category
     *
     * @param int $userID
     * @param int $categoryID
     * @param bool|null $followed
     * @return bool
     */
    protected function followCategory(int $userID, int $categoryID, ?bool $followed = null)
    {
        return $this->categoryModel->follow($userID, $categoryID, $followed);
    }

    /**
     * Assert that all the cached aggregate data on the category table is correct.
     *
     * @param int $categoryID
     */
    public function assertCategoryCounts(int $categoryID): void
    {
        $sql = \Gdn::database()->createSql();
        $category = $sql->getWhere("Category", ["CategoryID" => $categoryID])->firstRow(DATASET_TYPE_ARRAY);
        $this->assertNotEmpty($category);

        $counts = $sql
            ->select("d.DiscussionID", "count", "CountDiscussions")
            ->select("d.CountComments", "sum", "CountComments")
            ->from("Discussion d")
            ->where("CategoryID", $categoryID)
            ->get()
            ->firstRow(DATASET_TYPE_ARRAY);

        $descendantIDs = \CategoryModel::instance()->getCategoriesDescendantIDs([$categoryID]);
        $allCategoryIDs = array_merge([$categoryID], $descendantIDs);
        $allCounts = $sql
            ->select("d.DiscussionID", "count", "CountAllDiscussions")
            ->select("d.CountComments", "sum", "CountAllComments")
            ->from("Discussion d")
            ->where("CategoryID", $allCategoryIDs)
            ->get()
            ->firstRow(DATASET_TYPE_ARRAY);

        $expected = $counts + $allCounts;
        // Sum operations give us strings.
        $expected["CountComments"] = (int) $expected["CountComments"];
        $expected["CountAllComments"] = (int) $expected["CountAllComments"];

        $allCategoriesToCheckForLastPost = array_merge(
            [$categoryID],
            CategoryModel::instance()->getCategoryDescendantIDs($categoryID)
        );
        // Check the lastIDs.
        $lastDiscussion = $sql
            ->from("Discussion d")
            ->select(["DiscussionID", "DateLastComment", "LastCommentID"])
            ->where([
                "d.CategoryID" => $allCategoriesToCheckForLastPost,
            ])
            ->limit(1)
            ->orderBy(["-d.DateLastComment", "-d.DiscussionID"])
            ->get()
            ->firstRow(DATASET_TYPE_ARRAY);

        if ($lastDiscussion) {
            $expected += [
                "LastDiscussionID" => $lastDiscussion["DiscussionID"],
                "LastCommentID" => $lastDiscussion["LastCommentID"],
                "LastDateInserted" => $lastDiscussion["DateLastComment"],
            ];
        }

        VanillaTestCase::assertDataLike($expected, $category, "categoryID: $categoryID, name: {$category["Name"]}");
    }
}
