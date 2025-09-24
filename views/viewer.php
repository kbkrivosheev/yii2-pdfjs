<?php
use yii\helpers\Html;
use yii\helpers\Url;
use yii\helpers\ArrayHelper;
use yii\widgets\ActiveForm;
use yii\helpers\Json;
use yii2assets\pdfjs\PdfJsBookmarksAsset;
$url = Url::to(['/pdfjs', 'file' => Url::to($url)]);
PdfJsBookmarksAsset::register($this);
?>

    <div class="pdfjs-container">
        <?php if ($bookmarks['enabled'] && $bookmarks['showPanel']): ?>
            <!-- Кнопка переключения панели -->
            <div class="bookmarks-panel-toggle" title="Показать/скрыть панель закладок"
                 onclick="pdfJsBookmarks.togglePanel('<?= $id ?>')">
                <i class="fa toggle-icon fa-angle-left"></i>
            </div>

            <!-- Панель закладок -->
            <div id="<?= $id ?>-bookmarks-panel"
                 class="pdfjs-bookmarks-panel bookmarks-panel-<?= $bookmarks['position'] ?>">
                <div class="bookmarks-controls">
                    <button class="bookmark-btn" onclick="pdfJsBookmarks.addBookmark('<?= $id ?>')"
                            title="Добавить закладку для текущей страницы">
                        ➕ Добавить
                    </button>
                    <button class="bookmark-btn" onclick="pdfJsBookmarks.clearBookmarks('<?= $id ?>')"
                            title="Удалить все закладки">
                        🗑️ Очистить
                    </button>
                </div>
                <div id="<?= $id ?>-bookmarks-list" class="bookmarks-list">
                    <div class="mini-spinner"></div>
                </div>
            </div>
        <?php endif; ?>

        <div class="pdfjs-content">
            <?php $form = ActiveForm::begin([
                'id' => 'pdfjs-form-' . $id,
                'options' => [
                    'class' => 'form-horizontal',
                    'target' => 'pdfjs-' . $id
                ],
                'action' => $url
            ]) ?>

            <?php foreach ($buttons as $btn => $value): ?>
                <?= $value == false ? Html::hiddenInput($btn, 0) : null; ?>
            <?php endforeach; ?>

            <?php ActiveForm::end() ?>

            <?= Html::tag('iframe', '', ArrayHelper::merge([
                'id' => 'pdfjs-' . $id,
                'name' => 'pdfjs-' . $id
            ], $options)); ?>
        </div>
    </div>

<?php
// Инициализация закладок
$jsConfig = Json::encode([
    'pdfUrl' => $url,
    'bookmarksConfig' => $bookmarks
]);

$initScript = <<<JS
// Инициализация после загрузки документа
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.pdfJsBookmarks && {$jsConfig}.pdfUrl) {
            window.pdfJsBookmarks.init('{$id}', {$jsConfig});
        }
    }, 3000);
});

// Инициализация после загрузки iframe
document.getElementById('pdfjs-{$id}').addEventListener('load', function() {
    setTimeout(function() {
        if (window.pdfJsBookmarks && {$jsConfig}.pdfUrl) {
            window.pdfJsBookmarks.init('{$id}', {$jsConfig});
        }
    }, 2000);
});
JS;

$this->registerJs($initScript);

// Оригинальный JS код виджета
$this->registerJs('
  $("#pdfjs-form-' . $id . '").submit();
  $("#pdfjs-' . $id . '").css("background-color","#404040");
');
?>