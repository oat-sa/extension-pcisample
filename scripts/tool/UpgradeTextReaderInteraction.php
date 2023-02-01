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

namespace oat\pciSamples\scripts\tool;

use oat\oatbox\extension\script\ScriptAction;
use oat\oatbox\reporting\Report;
use oat\pciSamples\model\LegacyPciHelper\LegacyTextReaderItemUpdate;

class UpgradeTextReaderInteraction extends ScriptAction
{
    protected function provideOptions(): array
    {
        return [
            'task-queue' => [
                'prefix' => 'tq',
                'longPrefix' => 'task-queue',
                'description' => 'Task queue where operations has to be executed',
                'required' => false,
                'cast' => 'string'
            ],
            'skip-items-without-images' => [
                'prefix' => 'sn',
                'longPrefix' => 'skip-noimage',
                'description' => 'Set false if you need to convert PCIs even if they do not contain images',
                'required' => false,
                'defaultValue' => true,
                'cast' => 'bool'
            ]
        ];
    }

    protected function provideDescription(): string
    {
        return 'This command will execute update on all items that contain old PCI Text Reader' .
            PHP_EOL . 'to upgrade it to IMS version 1.0.0';
    }

    protected function run(): Report
    {
        $report = Report::createInfo(
            'Creating tasks for items required change'
        );

        $this->getLegacyTextReaderItemUpdate()->updateAllItems(
            $report,
            $this->getOption('task-queue'),
            $this->getOption('skip-items-without-images')
        );

        return $report;
    }

    private function getLegacyTextReaderItemUpdate(): LegacyTextReaderItemUpdate
    {
        return $this->getServiceManager()->getContainer()->get(LegacyTextReaderItemUpdate::class);
    }
}
