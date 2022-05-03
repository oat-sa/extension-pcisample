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

namespace oat\pciSamples\model\LegacyPciHelper;

use Exception;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\reporting\Report;
use oat\pciSamples\model\LegacyPciHelper\Task\UpgradeTextReaderInteractionTask;
use oat\tao\model\TaoOntology;
use oat\tao\model\taskQueue\QueueDispatcherInterface;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiItem\model\qti\interaction\PortableCustomInteraction;
use oat\taoQtiItem\model\qti\Item;
use oat\taoQtiItem\model\qti\Parser;
use taoItems_models_classes_ItemsService;

class LegacyTextReaderItemUpdate
{
    use OntologyAwareTrait;

    /** @var taoItems_models_classes_ItemsService */
    private $itemsService;

    /** @var TextReaderLegacyDetection */
    private $legacyDetection;

    /** @var QueueDispatcherInterface */
    private $queueDispatcher;

    public function __construct(
        taoItems_models_classes_ItemsService $itemsService,
        TextReaderLegacyDetection            $legacyDetection,
        QueueDispatcherInterface             $queueDispatcher
    ) {
        $this->itemsService = $itemsService;
        $this->legacyDetection = $legacyDetection;
        $this->queueDispatcher = $queueDispatcher;
    }

    public function updateAllItems(Report $report, ?string $queueName): void
    {
        foreach ($this->getItemResources() as $itemResource) {
            $itemUri = $itemResource->getUri();
            $itemXmlFile = $this->itemsService->getItemDirectory($itemResource)->getFile(QtiFile::FILE);
            $parser = new Parser($itemXmlFile->read());
            $xmlItem = $parser->load();

            foreach ($this->getPciInteractions($xmlItem) as $pciInteraction) {
                if ($this->legacyDetection->isTextReaderWithImage($pciInteraction)) {
                    try {
                        $this->queueDispatcher
                            ->getQueue(
                                $queueName ?? $this->queueDispatcher->getDefaultQueue()->getName()
                            )->enqueue(
                                $this->queueDispatcher->createTask(
                                    new UpgradeTextReaderInteractionTask(),
                                    [
                                        'itemUri' => $itemResource->getUri()
                                    ],
                                    sprintf("text-reader-%s", $itemUri)
                                )
                            );
                    } catch (Exception $exception) {
                        $report->add(Report::createError(
                            sprintf(
                                "Item contain legacy text reader interaction but failed on task creation with this message: %s",
                                $exception->getMessage()
                            )
                        ));
                    }

                    $report->add(Report::createInfo(
                        sprintf(
                            "Item %s contain legacy text reader interaction. Upgrade task has been created",
                            $itemUri
                        )
                    ));
                    break;
                }
            }
        }
    }

    private function getItemResources(): array
    {
        return $this->itemsService->getClass(TaoOntology::CLASS_URI_ITEM)->getInstances(true);
    }

    private function getPciInteractions(Item $xmlItem): array
    {
        return $xmlItem->getBody()->getElements(PortableCustomInteraction::class);
    }
}
