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

namespace oat\pciSamples\model\ServiceProvider;

use oat\generis\model\DependencyInjection\ContainerServiceProviderInterface;
use oat\pciSamples\model\LegacyPciHelper\ImageToPropertiesHelper;
use oat\pciSamples\model\LegacyPciHelper\LegacyTextReaderItemUpdate;
use oat\pciSamples\model\LegacyPciHelper\TextReaderLegacyDetection;
use oat\tao\model\taskQueue\QueueDispatcherInterface;
use oat\taoMediaManager\model\fileManagement\FileManagement;
use oat\taoMediaManager\model\MediaSource;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use taoItems_models_classes_ItemsService;

use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

class UpgradeProcessServiceProvider implements ContainerServiceProviderInterface
{
    public function __invoke(ContainerConfigurator $configurator): void
    {
        $services = $configurator->services();

        $services->set(MediaSource::class, MediaSource::class)
            ->private();

        $services->set(ImageToPropertiesHelper::class, ImageToPropertiesHelper::class)
            ->public()
            ->args([
                service(MediaSource::class),
                service(FileManagement::SERVICE_ID)
            ]);

        $services
            ->set(LegacyTextReaderItemUpdate::class, LegacyTextReaderItemUpdate::class)
            ->public()
            ->args([
                service(taoItems_models_classes_ItemsService::class),
                service(QueueDispatcherInterface::class)
            ]);

        $services
            ->set(TextReaderLegacyDetection::class, TextReaderLegacyDetection::class)
            ->public();
    }
}
