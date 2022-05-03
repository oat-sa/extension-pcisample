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
use oat\pciSamples\model\LegacyPciHelper\TextReaderLegacyDetection;
use oat\taoItems\model\preview\OntologyItemNotFoundException;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiItem\model\qti\interaction\PortableCustomInteraction;
use oat\taoQtiItem\model\qti\Parser;
use oat\taoQtiItem\model\qti\Service as QtiService;
use taoItems_models_classes_ItemsService;

class UpgradeTextReaderInteractionTask extends AbstractAction
{
    use ServiceManagerAwareTrait;
    use OntologyAwareTrait;

    /** @var Directory */
    private $itemDirectory;

    public function __invoke($params)
    {
        Report::createInfo('Starting a task');
        if (!isset($params['itemUri'])) {
            throw new WrongTaskPayloadException(
                sprintf('Could not find a resource with that uri: %s',
                    $params['itemUri'] ?? '<no value set>')
            );
        }

        $itemResource = $this->getResource($params['itemUri']);

        if (!$itemResource->exists()) {
            throw new OntologyItemNotFoundException();
        }
        $this->itemDirectory = $this->getItemService()->getItemDirectory($itemResource);
        $itemXmlFile = $this->itemDirectory->getFile(QtiFile::FILE);
        $parser = new Parser($itemXmlFile->read());
        $item = $parser->load();

        /** @var PortableCustomInteraction $pciInteraction */
        foreach ($item->getBody()->getElements(PortableCustomInteraction::class) as $pciInteraction) {
            if ($this->getTextReaderLegacyDetection()->isTextReaderWithImage($pciInteraction)) {
                $properties = $pciInteraction->getProperties();
                foreach ($properties['pages'] as $page) {
                    $images = $this->extractImages($page['content']);
                    $properties = $this->addImagesToProperties($images, $properties);
                }

                $pciInteraction->setProperties($properties);
            }
        }

        try {
            $this->getQtiService()->saveDataItemToRdfItem($item, $itemResource);
        } catch (Exception $e) {
            return Report::createError('Task failed');
        }
        return  Report::createSuccess('Task Success');
    }

    private function extractImages(array $content)
    {
        $images = [];
        foreach ($content as $element) {
            $dom = new DOMDocument;
            $dom->loadHTML($element);
            foreach ($dom->getElementsByTagName('img') as $image) {
                $images[] = [
                    'fileName' => $image->getAttribute('src'),
                ];
            }
        }

        return $images;
    }

    private function addImagesToProperties(array $images, array $properties)
    {
        foreach ($images as $image) {
            $properties['content-' . $image['fileName']] = sprintf(
                "data:image/png;base64,%s",
                base64_encode($this->itemDirectory->getFile($image['fileName'])->read())
            );
        }

        return $properties;
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
}
