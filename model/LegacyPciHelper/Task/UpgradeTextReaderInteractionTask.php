<?php

/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\pciSamples\model\LegacyPciHelper\Task;

use DOMDocument;
use Exception;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\extension\AbstractAction;
use oat\oatbox\filesystem\Directory;
use oat\oatbox\reporting\Report;
use oat\oatbox\service\ServiceManagerAwareTrait;
use oat\pciSamples\model\LegacyPciHelper\ImageToPropertiesHelper;
use oat\pciSamples\model\LegacyPciHelper\TextReaderLegacyDetection;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiItem\model\qti\interaction\CustomInteraction;
use oat\taoQtiItem\model\qti\interaction\ImsPortableCustomInteraction;
use oat\taoQtiItem\model\qti\interaction\PortableCustomInteraction;
use oat\taoQtiItem\model\qti\Item;
use oat\taoQtiItem\model\qti\Parser;
use oat\taoQtiItem\model\qti\QtiNamespace;
use oat\taoQtiItem\model\qti\Service as QtiService;
use taoItems_models_classes_ItemsService;

class UpgradeTextReaderInteractionTask extends AbstractAction
{
    use ServiceManagerAwareTrait;
    use OntologyAwareTrait;

    /** @var Directory */
    private $itemDirectory;

    public function __invoke($params): Report
    {
        $this->validatePayload($params);
        $itemResource = $this->getResource($params['itemUri']);

        if (!$itemResource->exists()) {
            return Report::createError('Item resource does not exist');
        }

        $this->itemDirectory = $this->getItemService()->getItemDirectory($itemResource);
        $itemXmlFile = $this->itemDirectory->getFile(QtiFile::FILE);
        $parser = new Parser($itemXmlFile->read());
        $xmlItem = $parser->load();

        if (!$this->isLegacyTextReader($xmlItem)) {
            return Report::createWarning("Item does not contain Legacy PCI Text Reader");
        }

        if ($params['skipItemsWithoutImages'] && !$this->isLegacyTextReaderWithImages($xmlItem)) {
            return Report::createWarning("Item does not contain any Text Reader with image, SKIPPING");
        }

        try {
            $params['skipItemsWithoutImages']
                ? $this->upgradeItemPCIsWithImages($xmlItem)
                : $this->upgradeItemPCIsAll($xmlItem);
            $this->getQtiService()->saveDataItemToRdfItem($xmlItem, $itemResource);
        } catch (Exception $e) {
            return Report::createError(
                sprintf(
                    'Task failed with item %s with error: %s',
                    $itemResource->getUri(),
                    $e->getMessage()
                )
            );
        }
        return  Report::createSuccess(
            sprintf(
                "Item %s has been modified with label: %s",
                $itemResource->getUri(),
                $itemResource->getLabel()
            )
        );
    }

    private function extractImages(array $content): array
    {
        $images = [];
        foreach ($content as $element) {
            $dom = new DOMDocument;
            // https://stackoverflow.com/questions/8218230/php-domdocument-loadhtml-not-encoding-utf-8-correctly
            $dom->loadHTML('<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' . $element);
            foreach ($dom->getElementsByTagName('img') as $image) {
                $images[] = [
                    'fileName' => $image->getAttribute('src'),
                ];
            }
        }

        return $images;
    }

    private function getPciInteractions(Item $xmlItem): array
    {
        return $xmlItem->getBody()->getElements(CustomInteraction::class);
    }

    private function isLegacyTextReader(Item $item): bool
    {
        foreach ($this->getPciInteractions($item) as $pciInteraction) {
            if ($this->getTextReaderLegacyDetection()->isLegacyTextReader($pciInteraction)) {
                return true;
            }
        }

        return false;
    }

    private function isLegacyTextReaderWithImages(Item $item): bool
    {
        foreach ($this->getPciInteractions($item) as $pciInteraction) {
            if ($this->getTextReaderLegacyDetection()->isTextReaderWithImage($pciInteraction)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @throws WrongTaskPayloadException
     */
    private function validatePayload($params): void
    {
        if (!isset($params['itemUri'])) {
            throw new WrongTaskPayloadException(
                sprintf('Could not find a resource with that uri: %s',
                    $params['itemUri'] ?? '<no value set>')
            );
        }

        if (!isset($params['skipItemsWithoutImages']) || !is_bool($params['skipItemsWithoutImages'])) {
            throw new WrongTaskPayloadException(
                'Missing required param skipItemsWithoutImages'
            );
        }
    }

    private function getItemService(): taoItems_models_classes_ItemsService
    {
        return $this->getServiceManager()->getContainer()->get(taoItems_models_classes_ItemsService::class);
    }

    private function getTextReaderLegacyDetection(): TextReaderLegacyDetection
    {
        return $this->getServiceManager()->getContainer()->get(TextReaderLegacyDetection::class);
    }

    private function getQtiService(): QtiService
    {
        return $this->getServiceManager()->getContainer()->get(QtiService::class);
    }

    private function getImageToPropertyHelper(): ImageToPropertiesHelper
    {
        return $this->getServiceManager()->getContainer()->get(ImageToPropertiesHelper::class);
    }

    private function upgradeItemPCIsWithImages(Item $xmlItem): void
    {
        foreach ($xmlItem->getBody()->getElements(PortableCustomInteraction::class) as $pciInteraction) {
            if ($this->getTextReaderLegacyDetection()->isTextReaderWithImage($pciInteraction)) {
                $properties = $pciInteraction->getProperties();
                foreach ($properties['pages'] as $page) {
                    $images = $this->extractImages($page['content']);
                    $properties = $this->getImageToPropertyHelper()->addImagesToProperties($images, $properties, $this->itemDirectory);
                }

                $this->setUpgradedNamespace($pciInteraction);
                $pciInteraction->setProperties($properties);
            }
        }
    }

    private function setUpgradedNamespace(CustomInteraction $pciInteraction): void
    {
        /* @var ImsPortableCustomInteraction $pciInteraction */
        $pciInteraction->setNamespace(new QtiNamespace(
            ImsPortableCustomInteraction::NS_URI,
            ImsPortableCustomInteraction::NS_NAME
        ));
    }

    private function upgradeItemPCIsAll(Item $xmlItem): void
    {
        foreach ($xmlItem->getBody()->getElements(PortableCustomInteraction::class) as $pciInteraction) {
            if ($this->getTextReaderLegacyDetection()->isLegacyTextReader($pciInteraction)) {
                $this->setUpgradedNamespace($pciInteraction);
            }
        }
    }
}
