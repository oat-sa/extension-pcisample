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
 * Copyright (c) 2022-2023 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\pciSamples\model\LegacyPciHelper;

use Exception;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\reporting\Report;
use oat\pciSamples\model\LegacyPciHelper\Task\UpgradeTextReaderInteractionTask;
use oat\tao\model\TaoOntology;
use oat\tao\model\taskQueue\QueueDispatcherInterface;
use taoItems_models_classes_ItemsService;

class LegacyTextReaderItemUpdate
{
    use OntologyAwareTrait;

    private taoItems_models_classes_ItemsService $itemsService;
    private QueueDispatcherInterface $queueDispatcher;

    public function __construct(
        taoItems_models_classes_ItemsService $itemsService,
        QueueDispatcherInterface $queueDispatcher
    ) {
        $this->itemsService = $itemsService;
        $this->queueDispatcher = $queueDispatcher;
    }

    public function updateAllItems(Report $report, ?string $queueName, bool $skipWithoutImages = true): void
    {
        foreach ($this->getItemResources() as $itemResource) {
            try {
                $this->queueDispatcher->linkTaskToQueue(
                    UpgradeTextReaderInteractionTask::class,
                    $queueName ?: $this->queueDispatcher->getDefaultQueue()->getName()
                );

                $this->queueDispatcher->createTask(
                    new UpgradeTextReaderInteractionTask(),
                    [
                        'itemUri' => $itemResource->getUri(),
                        'skipItemsWithoutImages' => $skipWithoutImages
                    ],
                    sprintf("TextReaderUpgradeForItem-%s", $itemResource->getUri())
                );
            } catch (Exception $exception) {
                $report->add(Report::createError(
                    sprintf(
                        "Item failed on task creation with this message: %s",
                        $exception->getMessage()
                    )
                ));
            }
        }
    }

    private function getItemResources(): array
    {
        return $this->itemsService->getClass(TaoOntology::CLASS_URI_ITEM)->getInstances(true);
    }
}
