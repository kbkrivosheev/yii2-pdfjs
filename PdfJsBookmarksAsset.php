<?php

namespace yii2assets\pdfjs;

use yii\web\AssetBundle;

class PdfJsBookmarksAsset extends AssetBundle
{
    public $sourcePath = '@yii2assets/pdfjs/assets';

    public $css = [
        'web/bookmarks.css',
    ];

    public $js = [
        'web/bookmarks.js',
    ];

}