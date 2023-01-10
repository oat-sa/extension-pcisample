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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA;
 *
 */

declare(strict_types=1);

namespace oat\pciSamples\model\event;

use Exception;
use oat\oatbox\service\ConfigurableService;
use oat\oatbox\reporting\Report;
use oat\taoQtiItem\model\event\ItemImported;
use oat\pciSamples\model\LegacyPciHelper\Task\UpgradeTextReaderInteractionTask;

/**
 * Listener for ItemImported event
 */
class UpgardeTextReaderInteractionListener extends ConfigurableService
{
    /**
     * Call UpgradeTextReaderInteractionTask when ItemImported event happens
     * @param ItemImported $event
     * @return null
     */
    public function whenItemImport(ItemImported $event): void
    {
        try {
            $upgradeTextReaderInteraction = new UpgradeTextReaderInteractionTask();
            $upgradeTextReaderInteraction->setServiceLocator($this->getServiceLocator());
            $report = $upgradeTextReaderInteraction(
                ['itemUri' => $event->getRdfItem()->getUri()]
            );

            if ($report->getType() === Report::TYPE_SUCCESS) {
                $this->logInfo($report->getMessage());
            } elseif ($report->getType() === Report::TYPE_WARNING) {
                $this->logWarning($report->getMessage());
            }
        } catch (Exception $exception) {
            $this->logError(
                sprintf(
                    "chinnu-- Upgrade TextReaderInteraction task failed with this message: %s",
                    $exception->getMessage()
                )
            );
        }
    }
}
