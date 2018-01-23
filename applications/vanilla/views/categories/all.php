<?php if (!defined('APPLICATION')) exit();
include_once $this->fetchViewLocation('helper_functions', 'categories');
$title = $this->data('Title');
if (!is_null($this->Category)) {
    $title .= followButton($this->Category->CategoryID);
}
echo '<h1 class="H HomepageTitle">'.$title.'</h1>';
if ($description = $this->description()) {
    echo wrap($description, 'div', ['class' => 'P PageDescription']);
}
$this->fireEvent('AfterPageTitle');
if (c('Vanilla.EnableCategoryFollowing')) {
    echo '<div class="PageControls Top">';
    echo categoryFilters();
    echo '</div>';
}
$categories = $this->data('CategoryTree');
writeCategoryList($categories, 1);

