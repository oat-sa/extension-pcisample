<?php

namespace oat\pciSamples\scripts\tool;

use oat\oatbox\action\Action;
use oat\pciSamples\model\update\ItemFixTextReaderDefaultValue;

/**
 * Class FixTextReaderDefaultValue
 * Usage : sudo -u www-data php index.php 'oat\pciSamples\scripts\tool\FixTextReaderDefaultValue' run
 * @package oat\pciSamples\scripts\tool
 */
class FixTextReaderDefaultValue implements Action
{

    public function __invoke($params)
    {
        $run = false;
        if (!empty($params) && $params[0] === 'run') {
            $run = true;
        }

        \common_ext_ExtensionsManager::singleton()->getExtensionById('taoQtiItem');

        $fs = \taoItems_models_classes_ItemsService::singleton()->getDefaultFileSource();
        $itemUpdater = new ItemFixTextReaderDefaultValue($fs->getPath());
        $res = $itemUpdater->update($run);
        if ($run) {
            return \common_report_Report::createSuccess('Item fixed ' . count($res));
        } else {
            return \common_report_Report::createInfo('Item to be fixed ' . count($res));
        }
    }
}